"use client";
import {useState} from 'react';
import {LoaderCircle,Check,AlertCircle} from '@/components/icons';
import {toast} from 'sonner';
import {DialogDescription} from '@/components/ui/dialog';
import {DialogBar} from './dialog-bar';
import {subjects,examTypes,mistakeTypes,type Question} from '@/lib/study';
import {describeQuestion,readClassification,difficulties,difficultyLabel,hasTopic,UNKNOWN_TOPIC} from '@/lib/classify';
import {useStudy,Choice,TopicSelect,postJson,mistakeLabel} from './shared';
// Etiket ekranı: her soru için küçük resim, "Konu · Alt konu" ve "Ders · Sınav · Zorluk"; düşük güvenli olanlar "emin olamadık" kartıdır.
export type Item={id:string;file:File;preview:string;status:'bekliyor'|'yükleniyor'|'tanınıyor'|'hazır'|'kontrol'|'hata';message?:string;question?:Question};
const working=(s:Item['status'])=>s==='bekliyor'||s==='yükleniyor'||s==='tanınıyor';
type Draft={subject:string;examType:string;topic:string;subtopic:string;difficulty:string;mistakeType:string};
const draftOf=(q:Question):Draft=>({subject:q.subject,examType:q.exam_type,topic:q.topic===UNKNOWN_TOPIC?'':q.topic,subtopic:readClassification(q.analysis)?.subtopic||'',difficulty:readClassification(q.analysis)?.difficulty||'',mistakeType:String(q.mistake_type||'yanlış')});
const stateLabel:Record<Item['status'],string>={bekliyor:'Sırada',yükleniyor:'Yükleniyor',tanınıyor:'Tanınıyor',hazır:'Hazır',kontrol:'Kontrol et',hata:'Hata'};
export function TagReview({items,busy,ai,hinted,onPatch,onRetry,onFinish}:{items:Item[];busy:boolean;ai:boolean;hinted:boolean;onPatch:(id:string,p:Partial<Item>)=>void;onRetry:(it:Item)=>void;onFinish:()=>void}){
 const s=useStudy();const [editing,setEditing]=useState<string|null>(null),[draft,setDraft]=useState<Draft|null>(null),[saving,setSaving]=useState(false);
 const total=items.length,done=items.filter(i=>!working(i.status)).length,saved=items.filter(i=>i.question).length,failed=items.filter(i=>i.status==='hata'&&!i.question).length;
 function edit(it:Item){if(!it.question)return;setDraft(draftOf(it.question));setEditing(it.id)}
 async function save(it:Item){
  if(!draft||!it.question||!hasTopic(draft.topic))return;setSaving(true);
  try{const body:Record<string,unknown>={subject:draft.subject,examType:draft.examType,subtopic:draft.subtopic,difficulty:draft.difficulty,mistakeType:draft.mistakeType,confirm:true,topic:draft.topic};
   const d=await postJson(`/api/questions/${it.question.id}`,body,'PATCH');onPatch(it.id,{question:d.question,status:'hazır',message:''});s.upsert(d.question);setEditing(null)}
  catch(e){toast.error((e as Error).message)}finally{setSaving(false)}}
 return <div className="tag-review">
  <DialogBar title={busy?'Sorular tanınıyor':`${saved} soru tanındı`} disabled={busy}/>
  <DialogDescription className="cap-lead">{busy?`${done} / ${total} hazır. Bu sırada ekranı kapatma.`:'Hepsine göz at; yanlış bir etiket varsa dokunup değiştir.'}</DialogDescription>
  <div className="tag-progress" role="progressbar" aria-label="Tanıma ilerlemesi" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>{items.map(i=><i key={i.id} className={working(i.status)?'':i.status==='hata'?'err':i.status==='kontrol'?'review':'on'}/>)}</div>
  <ul className="tag-list">{items.map((it,idx)=>{
   const q=it.question,d=q?describeQuestion(q):null;const isEdit=editing===it.id&&draft&&q;
   if(isEdit)return <li key={it.id} className="tag-card editing"><div className="tag-row"><Thumb it={it} n={idx+1}/><span className="tag-body"><span className="tag-eyebrow">Düzenleniyor</span><b className="tag-title">{d!.title}</b></span></div>
    <div className="tag-edit-grid">
     <label>Ders<Choice label="Dersi seç" value={draft.subject} onChange={v=>setDraft({...draft,subject:v,topic:'',subtopic:''})} values={subjects}/></label>
     <label>Sınav<Choice label="Sınav türünü seç" value={draft.examType} onChange={v=>setDraft({...draft,examType:v})} values={[...examTypes]}/></label>
     <label className="wide">Konu<TopicSelect subject={draft.subject} examType={draft.examType} value={draft.topic} onChange={v=>setDraft({...draft,topic:v,subtopic:''})}/></label>
     <label className="wide"><span>Alt konu <small>isteğe bağlı</small></span><input maxLength={80} value={draft.subtopic} placeholder="Örn. Zincir kuralı" onChange={e=>setDraft({...draft,subtopic:e.target.value})}/></label>
    </div>
    <fieldset className="tag-fieldset"><legend>Zorluk</legend><div className="tag-seg three">{difficulties.map(x=><button type="button" key={x} aria-pressed={draft.difficulty===x} className={draft.difficulty===x?'on':''} onClick={()=>setDraft({...draft,difficulty:draft.difficulty===x?'':x})}>{difficultyLabel[x]}</button>)}</div></fieldset>
    <fieldset className="tag-fieldset"><legend>Ne oldu?</legend><div className="tag-seg three">{mistakeTypes.map(m=><button type="button" key={m} aria-pressed={draft.mistakeType===m} className={draft.mistakeType===m?'on':''} onClick={()=>setDraft({...draft,mistakeType:m})}>{m==='emin değildim'?'Emin değildim':m==='boş'?'Boş':'Yanlış'}</button>)}</div><small className="tag-help">{mistakeLabel[draft.mistakeType]}</small></fieldset>
    {!hasTopic(draft.topic)&&<p className="tag-why" role="status">Konu seç; konu belirlenmeden etiket doğrulanmış sayılmaz.</p>}
    <div className="tag-edit-actions"><button type="button" className="tag-save" disabled={saving||!hasTopic(draft.topic)} onClick={()=>void save(it)}>{saving?<LoaderCircle className="spin" size={16}/>:<Check size={16}/>} Kaydet</button><button type="button" className="secondary" disabled={saving} onClick={()=>setEditing(null)}>Vazgeç</button></div></li>;
   const review=it.status==='kontrol';
   return <li key={it.id} className={'tag-card'+(review?' review':'')+(it.status==='hata'?' error':'')} aria-busy={working(it.status)}>
    <div className="tag-row"><Thumb it={it} n={idx+1}/>
     <span className="tag-body">
      {review&&<span className="tag-eyebrow warm">Emin olamadık</span>}
      {working(it.status)?<><b className="tag-title">{it.status==='tanınıyor'?'Soru tanınıyor':it.status==='bekliyor'?'Sırada':'Yükleniyor'}</b><span className="tag-meta"><LoaderCircle className="spin" size={14}/> {stateLabel[it.status]}<span className="sr-only"> {idx+1}. soru</span></span></>
      :it.status==='hata'?<><b className="tag-title"><AlertCircle size={16}/> Bu soru hazırlanamadı</b><span className="tag-meta">{it.message||'Tekrar dene.'}</span></>
      :<><b className="tag-title">{d!.title}</b><span className="tag-meta">{d!.meta}</span>{review&&<span className="tag-why">{it.message||d!.reason||'Konu net belirlenemedi; bir göz at.'}</span>}</>}
     </span>
     {it.status==='hata'?<button type="button" className="tag-btn" disabled={busy} onClick={()=>onRetry(it)}>Tekrar dene</button>
     :q&&!working(it.status)?<button type="button" className="tag-btn" onClick={()=>edit(it)} aria-label={`${idx+1}. soruyu ${review?'kontrol et':'düzenle'}`}>{review?'Kontrol et':'Düzenle'}</button>:null}
    </div></li>})}</ul>
  <div className="tag-foot">
   {failed>0&&!busy&&<p className="form-error" role="alert">{failed} soru kaydedilemedi. “Tekrar dene” ile yeniden gönder ya da bu haliyle bitir.</p>}
   <button type="button" className="primary full cap-main" disabled={busy||saving} onClick={onFinish}>{busy?<><LoaderCircle className="spin" size={18}/> Tanınıyor</>:saved>0?`Tamam, ${saved} soru defterde`:'Kapat'}</button>
   <span className="tag-note">{hinted?'Sorular defterine kaydedildi. Ders ve konu programdan geldi.':ai?'Sorular defterine kaydedildi. Tekrar günleri kendiliğinden planlanır: 1, 3, 7, 14, 30 ve 60. gün. Çözümler arka planda sırayla hazırlanır.':'Sorular defterine kaydedildi. Tekrar günleri kendiliğinden planlanır: 1, 3, 7, 14, 30 ve 60. gün.'}</span>
  </div></div>}
function Thumb({it,n}:{it:Item;n:number}){return <span className="tag-thumb"><img src={it.preview} alt={`${n}. soru fotoğrafı`}/><i aria-hidden="true">{n}</i></span>}
