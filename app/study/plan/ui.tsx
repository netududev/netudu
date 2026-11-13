"use client";
import {useCallback,useEffect,useState} from 'react';
import {Check,Undo2,Umbrella,Play,PlusCircle,NotebookPen,Send,AlertTriangle,School,Pin,BookOpen,Coffee,RefreshCw,ThumbsDown,ExternalLink,LoaderCircle,Sigma,Zap,FlaskConical,Dna,Globe,FileText,Flag,Target,GraduationCap,CalendarClock,Wand2,List} from '@/components/icons';
import {toast} from 'sonner';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {buildDay,noteSubject,dayShareText,telegramUrl,toMin,type DayPlan,type DayItem,type PlanState,type Lesson} from '@/lib/plan/scheduler';
import {normalizeTopic,type Video} from '@/lib/study';
import {useStudy,SampleSkeleton,postJson,videoId,formatViews} from '../shared';

export const longDate=(d:string)=>new Date(d+'T12:00:00').toLocaleDateString('tr-TR',{day:'numeric',month:'long',weekday:'long'});
export const shortDate=(d:string)=>new Date(d+'T12:00:00').toLocaleDateString('tr-TR',{day:'numeric',month:'short'});
export const nowMin=()=>{const n=new Date();return n.getHours()*60+n.getMinutes()};
export const localToday=()=>{const n=new Date();return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`};

const itemIcon:Record<DayItem['type'],typeof Check>={school:School,fixed:Pin,study:BookOpen,resource:List,off:Coffee};
// Günün birleşik saat çizelgesi (okul, sabit bloklar, çalışma blokları)
export function Timeline({day,live=false}:{day:DayPlan;live?:boolean}){const n=live?nowMin():-1;
 return <ol className="timeline">{day.items.map((it,i)=>{const Icon=itemIcon[it.type]||BookOpen;const current=live&&it.type!=='off'&&n>=it.startMin&&n<it.endMin;const past=live&&it.type!=='off'&&n>=it.endMin;
  return <li key={i} className={`tl-item tl-${String(it.type)}${current?' now':''}${past?' past':''}`}><span className="tl-time">{it.start}{it.end?<><br/><small>{it.end}</small></>:null}</span><span className="tl-dot"><Icon size={15}/></span><div className="tl-body"><strong>{it.title}</strong><small>{it.detail}{!it.fitted?' · kısaltıldı':''}</small>{current&&<span className="tl-now">Şu an</span>}</div></li>})}
  {!day.items.length&&<li className="tl-empty">Bu gün için planlanmış bir şey yok.</li>}</ol>}

export function Warnings({day}:{day:DayPlan}){if(!day.warnings.length)return null;return <div className="plan-warn"><AlertTriangle size={17}/><div>{day.warnings.map((w,i)=><p key={i}>{w}</p>)}</div></div>}

// Bir günün ders işlemleri: tamamla, ertele (domino), video, yanlış ekle, ders notu, paylaş
export function LessonActions({day,compact=false}:{day:DayPlan;compact?:boolean}){const s=useStudy();const plan=s.plan!;const l=day.lesson;const isDone=!!(l&&plan.done[String(l.index)]);
 const resolveTopic=(subj:string,rawTopic:string)=>{const norm=normalizeTopic(subj,rawTopic);return norm!=='Konu belirlenmedi'?norm:''};
 const ask=()=>{if(!l)return;const sub=noteSubject(l.subj);s.openUpload([],{subject:sub,topic:resolveTopic(sub,l.topic),examType:'TYT',exam:`Program · ${l.weekNum}. hafta`,question:''})};
 const askBtn=l&&<button className="secondary" onClick={ask}><PlusCircle size={16}/> Yanlış ekle</button>;
 const noteBtn=l&&<button className="secondary" onClick={()=>{const sub=noteSubject(l.subj);s.openNotes({subject:sub,topic:resolveTopic(sub,l.topic),examType:'TYT'})}}><NotebookPen size={16}/> Ders notu hazırla</button>;
 const share=<a className="text-button" href={telegramUrl(dayShareText(day))} target="_blank" rel="noreferrer"><Send size={15}/> Paylaş</a>;
 return <div className={'lesson-actions'+(compact?' compact':'')}>
  {l&&<button className={isDone?'secondary':'primary'} onClick={()=>void s.planOp({action:isDone?'undone':'done',lesson:l.index},isDone?'Ders yeniden açıldı.':'Ders tamamlandı.')}>{isDone?<><Undo2 size={16}/> Geri al</>:<><Check size={16}/> Tamamla</>}</button>}
  {day.isOff?<button className="secondary" onClick={()=>void s.planOp({action:'unshift',slot:day.slot},'Kaydırma geri alındı.')}><Undo2 size={16}/> Kaydırmayı geri al</button>:l&&!isDone&&<button className="secondary" onClick={()=>void s.planOp({action:'shift',slot:day.slot},'Ders yarına kaydırıldı; program bir gün uzadı.')} title="Bugün çalışamayacaksan dersler bir gün ileri kayar"><Umbrella size={16}/> Günü kaydır</button>}
  {l&&<button className="secondary" onClick={()=>s.openLessonVideo(l)}><Play size={16}/> {compact?'Video':`Videoyu izle · ${l.teacher.split(/[&/]/)[0].trim()}`}</button>}
  {!compact&&<details className="la-more"><summary>Daha fazla</summary><div>{askBtn}{noteBtn}{share}</div></details>}
 </div>}

// Boş durum: programı yokken tek başlık, tek cümle, tek eylem (Bugün ve Haftalık program ortak kullanır)
export function PlanStart(){const s=useStudy();
 return <section className="plan-start">
  <div className="plan-start-copy"><span className="plan-start-ico"><CalendarClock size={24} aria-hidden="true"/></span><h2>Programını oluştur</h2><p>Okul ve dershane saatlerini gir. Her günün işi boş saatlerine çakışmadan yerleşir.</p><button className="primary" onClick={s.openWizard}><Wand2 size={18}/> Programı oluştur</button>
   <ol className="empty-steps"><li><b>1</b><span>Okul, dershane ve günlük çalışma aralığını gir.</span></li><li><b>2</b><span>Çalışma temposunu seç.</span></li><li><b>3</b><span>Başlangıç tarihi ve hatırlatmayı seç, ilk haftayı önizle.</span></li></ol></div>
  <div className="plan-start-sample"><SampleSkeleton kind="rows" label="Günün akışı"/><SampleSkeleton kind="chart" label="İlerleme çizgisi"/></div>
 </section>}

// Tamamlanma işareti: çember ve onay çizgisi CSS ile çizilir (hareket azaltmada doğrudan görünür)
export function DoneMark(){return <svg className="done-mark" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10.5" pathLength="1"/><path d="M7 12.5l3.2 3.2L17 8.8" pathLength="1"/></svg>}

export function LessonVideoDialog({lesson,onClose}:{lesson:Lesson|null;onClose:()=>void}){
 const [videos,setVideos]=useState<Video[]>([]);
 const [activeUrl,setActiveUrl]=useState('');
 const [loading,setLoading]=useState(false);
 const [rejected,setRejected]=useState<string[]>([]);
 const loadVideos=useCallback(async(l:Lesson,force:boolean,extraReject?:string)=>{
  const nextReject=extraReject?[...rejected,extraReject]:rejected;
  if(extraReject)setRejected(nextReject);
  const sub=noteSubject(l.subj);
  const baseVideo:Video={title:`${l.subj} — ${l.topic}`,url:l.directUrl,reason:`Program önerisi · ${l.teacher}`,channel:l.teacher};
  setLoading(true);
  try{
   const d=await postJson('/api/videos',{subject:sub,topic:l.topic,examType:'TYT',teacher:l.teacher.split(/[&/]/)[0].trim(),force,rejectedUrls:nextReject});
   const list=[baseVideo,...(d.videos||[]).filter(v=>v.url!==baseVideo.url)].filter(v=>!nextReject.includes(v.url));
   setVideos(list.length?list:[baseVideo]);
   if(extraReject&&activeUrl===extraReject&&list[0])setActiveUrl(list[0].url);
  }catch{
   setVideos([baseVideo]);
  }finally{setLoading(false)}
 },[rejected,activeUrl]);
 useEffect(()=>{
  if(!lesson){setVideos([]);setActiveUrl('');setRejected([]);return}
  const baseVideo:Video={title:`${lesson.subj} — ${lesson.topic}`,url:lesson.directUrl,reason:`Önerilen video · ${lesson.teacher}`,channel:lesson.teacher};
  setVideos([baseVideo]);
  setActiveUrl(lesson.directUrl);
  setRejected([]);
  void loadVideos(lesson,false);
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[lesson?.index,lesson?.directUrl]);
 const activeVid=videoId(activeUrl);
 return <Dialog open={!!lesson} onOpenChange={v=>{if(!v)onClose()}}><DialogContent className="question-dialog"><DialogHeader><DialogTitle>{lesson?.subj} — {lesson?.topic}</DialogTitle><DialogDescription>{lesson?.weekNum}. hafta · Anlatan: {lesson?.teacher} · Hedef: {lesson?.target}</DialogDescription></DialogHeader>
  {lesson&&<div className="video-area">
   <div className="section-heading"><div><h3>Konu videosu</h3><p className="muted">Video aşağıda oynar. Aşağıdaki alternatiflerden birini seçebilirsin.</p></div><div className="actions"><button className="secondary" disabled={loading} onClick={()=>void loadVideos(lesson,true)}>{loading?<LoaderCircle className="spin" size={16}/>:<RefreshCw size={16}/>} Yeniden ara</button>{activeUrl&&<a className="secondary" href={activeUrl} target="_blank" rel="noreferrer"><ExternalLink size={16}/> YouTube'da aç</a>}</div></div>
   {activeVid&&<iframe className="video-player" src={`https://www.youtube-nocookie.com/embed/${activeVid}?rel=0`} title={lesson.topic} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen/>}
   {videos.map((v,i)=>{const isSel=v.url===activeUrl;return <div className={'video-card'+(isSel?' active':'')} key={v.url}><button type="button" className="video-main" onClick={()=>setActiveUrl(v.url)}><span className="play-icon"><Play size={22}/></span><div><span className="eyebrow">{i===0?'ÖNERİLEN':'ALTERNATİF'}{isSel?' · OYNATILIYOR':''}</span><h3>{v.title}</h3><p>{v.reason}</p><small>{[v.channel,v.duration,formatViews(v.views)&&formatViews(v.views)+' görüntülenme'].filter(Boolean).join(' · ')||v.url}</small></div></button><div className="actions wrap"><a className="text-button" href={v.url} target="_blank" rel="noreferrer"><ExternalLink size={14}/> YouTube'da aç</a>{videos.length>1&&<button className="text-button reject" disabled={loading} onClick={()=>{toast.message('Alternatif video aranıyor.');void loadVideos(lesson,true,v.url)}}><ThumbsDown size={14}/> Uygun değil</button>}</div></div>})}
  </div>}
 </DialogContent></Dialog>;
}

export function SubjectIcon({subj,size=14}:{subj:string;size?:number}){const s=subj.toLocaleLowerCase('tr');const p={size,'aria-hidden':true as const,style:{verticalAlign:'-2px'}};return /matematik|geometri/.test(s)?<Sigma {...p}/>:s.includes('türkçe')||s.includes('paragraf')?<BookOpen {...p}/>:s.includes('fizik')?<Zap {...p}/>:s.includes('kimya')?<FlaskConical {...p}/>:s.includes('biyoloji')?<Dna {...p}/>:/tarih|coğrafya|sosyal|felsefe|din/.test(s)?<Globe {...p}/>:s.includes('deneme')?<FileText {...p}/>:<BookOpen {...p}/>}
export function LessonHead({day}:{day:DayPlan}){const l=day.lesson;if(day.isOff)return <div className="lesson-head off"><span className="lesson-emoji"><Umbrella size={18} aria-hidden="true"/></span><div><span className="eyebrow">KAYDIRILDI</span><h3>Dinlenme günü</h3><p>Bu günün dersi bir sonraki güne aktarıldı; program bir gün uzadı.</p></div></div>;
 if(!l)return <div className="lesson-head"><span className="lesson-emoji">{day.finished?<Flag size={18} aria-hidden="true"/>:<FileText size={18} aria-hidden="true"/>}</span><div><span className="eyebrow">{day.finished?'PROGRAM TAMAMLANDI':'SERBEST GÜN'}</span><h3>{day.finished?'Tüm konular bitti. Şimdi deneme ve eksik kapatma zamanı.':'Serbest tekrar'}</h3><p>Bir TYT denemesi çöz, yanlışlarını deftere ekle.</p></div></div>;
 return <div className="lesson-head"><span className="lesson-emoji"><SubjectIcon subj={l.subj} size={18}/></span><div><span className="eyebrow">{l.subj.toLocaleUpperCase('tr')} · {l.weekNum}. HAFTA{day.shifted?' · KAYDIRILDI':''}</span><h3>{l.topic}</h3><p>{l.note}</p><div className="lesson-meta"><span><Target size={14} aria-hidden="true" style={{verticalAlign:'-2px'}}/> {l.target}</span><span><GraduationCap size={14} aria-hidden="true" style={{verticalAlign:'-2px'}}/> {l.teacher}</span></div></div></div>}

// Kaynak görevlerinin aralığı bugüne göre hesaplanır: bugün = cihazın yerel günü
export const dayFor=(plan:PlanState,date:string)=>buildDay(plan,date,localToday());
export function nextBlock(day:DayPlan){const n=nowMin();return day.items.find(i=>i.type!=='off'&&i.startMin>n)||null}
export function minutesUntil(t:string){return toMin(t)-nowMin()}
