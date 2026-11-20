"use client";
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {toast} from 'sonner';
import {Check,Plus,Trash2,X,Wand2,RotateCcw,LoaderCircle,ArrowRight,ArrowLeft,ChevronLeft,ChevronRight,Target} from '@/components/icons';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {ALL_DAYS,DAY_FULL_NAMES} from '@/lib/plan/scheduler';
import {makeQueue} from '@/lib/plan/queue';
import {GRADES,TRACKS,SPACINGS,defaultFlexConfig,normalizeFlexConfig,balanceNote,tasksOn,dayProgress,weekStart,addDays,KIND_LABEL,type FlexPlan,type FlexTask,type FlexConfig,type Grade,type Track,type Spacing,type Balance} from '@/lib/plan/flex';
import {subjects,topicOptions} from '@/lib/study';
import {useStudy,api,postJson,Empty,SkelRows} from '../shared';
import {DayPills} from './wizard';
import {shortDate,localToday} from './ui';

type Res={plan:FlexPlan|null};
const gradeLabel=(g:Grade)=>g==='Mezun'?'Mezun':`${g}. sınıf`;
const num=(v:string)=>{const n=Number(v.replace(',','.'));return Number.isFinite(n)?n:0};

// ---------- veri ----------
// Tüm işlemler tek sırada çalışır: sunucu planı oku-değiştir-yaz yaptığı için eşzamanlı istekler birbirini ezerdi.
function useFlexPlan(){const [plan,setPlan]=useState<FlexPlan|null|undefined>(undefined);const queue=useRef(makeQueue());
 const load=useCallback(async()=>{try{const d=await api('/api/plan/flex') as unknown as Res;setPlan(d.plan)}catch(e){toast.error((e as Error).message);setPlan(p=>p===undefined?null:p)}},[]);
 useEffect(()=>{void load()},[load]);
 const op=useCallback((body:Record<string,unknown>,success?:string):Promise<boolean>=>queue.current('flex',async()=>{try{const d=await postJson('/api/plan/flex',body) as unknown as Res;setPlan(d.plan);if(success)toast.success(success);return true}catch(e){toast.error((e as Error).message);void load();return false}}),[load]);
 return {plan,setPlan,load,op}}

// ---------- ana ekran ----------
export function FlexView(){const s=useStudy();const {plan,setPlan,op}=useFlexPlan();const [wizard,setWizard]=useState(false);const [week,setWeek]=useState(()=>weekStart(localToday()));const [busy,setBusy]=useState(false);
 const today=localToday();
 const days=useMemo(()=>Array.from({length:7},(_,i)=>addDays(week,i)),[week]);
 if(plan===undefined)return <SkelRows rows={4}/>;
 if(!plan)return <><Empty title="Görev planın henüz yok." icon={<Target/>} action={<button className="primary" onClick={()=>setWizard(true)}><Wand2 size={17}/> Planı oluştur</button>} steps={['Sınıfını ve netlerini söyle','Eksik olduğun dersleri işaretle','Her gün yapacağın görevleri al, istediğin gibi düzenle']}>Saat yok: sınıfına, eksiklerine ve netlerine göre her gün ne yapacağını sade bir liste olarak alırsın.</Empty><FlexWizard open={wizard} onClose={()=>setWizard(false)} plan={null} onSaved={setPlan}/></>;
 const prog=dayProgress(plan,today);const weekTasks=days.flatMap(d=>plan.tasks.filter(t=>t.date===d));const wDone=weekTasks.filter(t=>t.done).length;
 async function regenerate(){if(!confirm('Bugünden sonraki, yapılmamış ve elle değiştirmediğin görevler ayarlarına göre yeniden oluşturulsun mu? Yaptıkların ve elle eklediklerin ya da değiştirdiklerin kalır.'))return;setBusy(true);await op({action:'regenerate'},'Gelecek görevler yenilendi.');setBusy(false)}
 return <>
  <section className="panel flex-head"><div className="flex-head-main"><span className="eyebrow">{gradeLabel(plan.config.grade).toLocaleUpperCase('tr')}{plan.config.grade!=='9'&&plan.config.grade!=='10'?` · ${TRACKS.find(t=>t.id===plan.config.track)?.label.toLocaleUpperCase('tr')}`:''}</span><h2>{prog.total?`Bugün ${prog.done}/${prog.total} görev`:'Bugün görev yok'}</h2><p className="muted">{balanceNote(plan.config,today)}</p></div>
   <div className="flex-head-bar" role="img" aria-label={`Bu hafta ${wDone}/${weekTasks.length} görev`}><div><span>Bu hafta</span><b>{wDone}/{weekTasks.length}</b></div><i className="bar"><b style={{width:(weekTasks.length?wDone/weekTasks.length*100:0)+'%'}}/></i></div>
   <div className="flex-head-actions"><button className="secondary" onClick={()=>setWizard(true)}><Wand2 size={16}/> Programı düzenle</button><button className="secondary" disabled={busy} onClick={()=>void regenerate()}>{busy?<LoaderCircle className="spin" size={16}/>:<RotateCcw size={16}/>} Yeniden oluştur</button></div></section>
  <div className="flex-week-nav"><button className="icon-button" aria-label="Önceki hafta" onClick={()=>setWeek(w=>addDays(w,-7))}><ChevronLeft size={18}/></button><b>{shortDate(days[0])} – {shortDate(days[6])}</b><button className="icon-button" aria-label="Sonraki hafta" onClick={()=>setWeek(w=>addDays(w,7))}><ChevronRight size={18}/></button>{week!==weekStart(today)&&<button className="secondary" onClick={()=>setWeek(weekStart(today))}>Bu hafta</button>}</div>
  <section className="flex-days">{days.map(d=><FlexDay key={d} date={d} plan={plan} today={today} op={op} setPlan={setPlan}/>)}</section>
  <FlexWizard open={wizard} onClose={()=>setWizard(false)} plan={plan} onSaved={setPlan}/>
 </>}

// ---------- gün kartı ----------
function FlexDay({date,plan,today,op,setPlan}:{date:string;plan:FlexPlan;today:string;op:(b:Record<string,unknown>,s?:string)=>Promise<boolean>;setPlan:(p:FlexPlan)=>void}){
 const tasks=tasksOn(plan,date);const dayKey=ALL_DAYS[(new Date(date+'T12:00:00Z').getUTCDay()+6)%7];const rest=!plan.config.days.includes(dayKey);const pr=dayProgress(plan,date);
 const [adding,setAdding]=useState(false);const [title,setTitle]=useState('');
 // Anında yansıma: işaretleme önce ekranda, sonra sunucuda
 function toggle(t:FlexTask){setPlan({...plan,tasks:plan.tasks.map(x=>x.id===t.id?{...x,done:!x.done}:x)});void op({action:'toggle',id:t.id,done:!t.done})}
 async function add(){const v=title.trim();if(!v)return;if(await op({action:'add',date,title:v})){setTitle('');setAdding(false)}}
 return <article className={'flex-day'+(date===today?' today':'')+(date<today?' past':'')+(rest&&!tasks.length?' rest':'')}>
  <header><div><strong>{DAY_FULL_NAMES[dayKey]}</strong><small>{shortDate(date)}</small></div>{date===today&&<span className="status good">Bugün</span>}{pr.total>0&&<span className="flex-count">{pr.done}/{pr.total}</span>}</header>
  {tasks.length>0?<ul className="flex-tasks">{tasks.map(t=><FlexTaskRow key={t.id} task={t} onToggle={()=>toggle(t)} op={op}/>)}</ul>:<p className="muted small">{rest?'Dinlenme günü.':'Bu güne görev yok.'}</p>}
  {adding?<form className="flex-add" onSubmit={e=>{e.preventDefault();void add()}}><input autoFocus aria-label="Yeni görev" maxLength={120} placeholder="Örn. Fizik: kuvvet soruları" value={title} onChange={e=>setTitle(e.target.value)}/><button className="primary" type="submit"><Check size={16}/> Ekle</button><button type="button" className="icon-button" aria-label="Vazgeç" onClick={()=>{setAdding(false);setTitle('')}}><X size={16}/></button></form>:<button type="button" className="flex-add-btn" onClick={()=>setAdding(true)}><Plus size={15}/> Görev ekle</button>}
 </article>}

function FlexTaskRow({task:t,onToggle,op}:{task:FlexTask;onToggle:()=>void;op:(b:Record<string,unknown>,s?:string)=>Promise<boolean>}){
 const [edit,setEdit]=useState(false);const [f,setF]=useState({title:t.title,detail:t.detail,date:t.date});
 useEffect(()=>{if(!edit)setF({title:t.title,detail:t.detail,date:t.date})},[edit,t.title,t.detail,t.date]);
 async function save(){if(!f.title.trim()){toast.error('Görevin bir adı olsun.');return}if(await op({action:'update',id:t.id,title:f.title.trim(),detail:f.detail.trim(),date:f.date}))setEdit(false)}
 if(edit)return <li className="flex-task editing"><form onSubmit={e=>{e.preventDefault();void save()}}>
  <label>Görev<input maxLength={120} value={f.title} onChange={e=>setF({...f,title:e.target.value})}/></label>
  <label>Ayrıntı<input maxLength={240} value={f.detail} onChange={e=>setF({...f,detail:e.target.value})}/></label>
  <label>Gün<input type="date" value={f.date} onChange={e=>{if(e.target.value)setF({...f,date:e.target.value})}}/></label>
  <div className="flex-edit-actions"><button className="primary" type="submit"><Check size={16}/> Kaydet</button><button type="button" className="secondary" onClick={()=>setEdit(false)}>Vazgeç</button><button type="button" className="icon-button" aria-label="Görevi sil" onClick={()=>{void op({action:'remove',id:t.id})}}><Trash2 size={16}/></button></div></form></li>;
 return <li className={'flex-task k-'+t.kind+(t.done?' done':'')}>
  <button type="button" className="flex-check" role="checkbox" aria-checked={t.done} aria-label={(t.done?'Geri al: ':'Tamamla: ')+t.title} onClick={onToggle}>{t.done&&<Check size={14}/>}</button>
  <button type="button" className="flex-body" onClick={()=>setEdit(true)} aria-label={`Düzenle: ${t.title}`}><span className="flex-title">{t.title}</span>{t.detail&&<small>{t.detail}</small>}
   <span className="flex-chips"><i>{KIND_LABEL[t.kind]}</i>{t.exam&&<i>{t.exam}</i>}{t.grade&&<i>{t.grade}. sınıf</i>}{t.pool==='eksik'&&<i className="weak">Eksik konu</i>}</span></button></li>}

// ---------- kurulum sihirbazı (3 adım) ----------
const steps=['Seni tanıyalım','Eksiklerin','Tempo ve tekrar'];
function Chips<T extends string|number>({options,value,onChange,label}:{options:{id:T;label:string;hint?:string}[];value:T;onChange:(v:T)=>void;label:string}){return <div className="flex-chip-row" role="radiogroup" aria-label={label}>{options.map(o=><button type="button" key={String(o.id)} role="radio" aria-checked={o.id===value} className={'flex-chip'+(o.id===value?' on':'')} onClick={()=>onChange(o.id)}><b>{o.label}</b>{o.hint&&<small>{o.hint}</small>}</button>)}</div>}

export function FlexWizard({open,onClose,plan,onSaved}:{open:boolean;onClose:()=>void;plan:FlexPlan|null;onSaved:(p:FlexPlan|null)=>void}){const s=useStudy();const [step,setStep]=useState(0);const [busy,setBusy]=useState(false);
 const lastNet=useCallback((type:string)=>{const e=[...s.exams].filter(x=>x.exam_type===type).sort((a,b)=>b.date.localeCompare(a.date))[0];return e?e.net:0},[s.exams]);
 const fresh=useCallback(():FlexConfig=>{if(plan)return plan.config;const c=defaultFlexConfig(localToday(),s.profile.grade);return {...c,tytNet:lastNet('TYT'),aytNet:lastNet('AYT'),examDate:s.profile.examDate||''}},[plan,s.profile.grade,s.profile.examDate,lastNet]);
 const [cfg,setCfg]=useState<FlexConfig>(fresh);
 useEffect(()=>{if(open){setCfg(fresh());setStep(0)}// eslint-disable-next-line react-hooks/exhaustive-deps
 },[open]);
 const set=<K extends keyof FlexConfig>(k:K,v:FlexConfig[K])=>setCfg(c=>({...c,[k]:v}));
 const upper=cfg.grade==='9'||cfg.grade==='10'?false:true;
 // Yeni plan kurarken sınıf değişince tempo önerileri o sınıfa göre gelir; mevcut planı düzenlerken kullanıcının seçimleri bozulmaz
 function setGrade(g:Grade){setCfg(c=>{const d=defaultFlexConfig(c.startDate,g);return plan?{...c,grade:g}:{...c,grade:g,topicsPerWeek:d.topicsPerWeek,dailyTasks:d.dailyTasks}})}
 const maxGrade=cfg.grade==='Mezun'?12:Number(cfg.grade);
 function toggleSubject(sub:string){setCfg(c=>c.weakSubjects.includes(sub)?{...c,weakSubjects:c.weakSubjects.filter(x=>x!==sub),weakTopics:c.weakTopics.filter(t=>t.subject!==sub)}:{...c,weakSubjects:[...c.weakSubjects,sub]})}
 function toggleTopic(subject:string,topic:string){setCfg(c=>c.weakTopics.some(t=>t.subject===subject&&t.topic===topic)?{...c,weakTopics:c.weakTopics.filter(t=>!(t.subject===subject&&t.topic===topic))}:{...c,weakTopics:[...c.weakTopics,{subject,topic}]})}
 async function save(){setBusy(true);try{const d=await postJson('/api/plan/flex',{config:normalizeFlexConfig(cfg,localToday())},'PUT') as unknown as Res;onSaved(d.plan);toast.success(plan?'Programın güncellendi.':'Görev planın hazır.');onClose()}catch(e){toast.error((e as Error).message)}finally{setBusy(false)}}
 return <Dialog open={open} onOpenChange={v=>{if(!v&&!busy)onClose()}}><DialogContent className="question-dialog wizard flex-wizard"><DialogHeader><DialogTitle>{plan?'Programı düzenle':'Görev planını oluştur'}</DialogTitle><DialogDescription>Saat yok. Sınıfına, eksiklerine ve netlerine göre her gün ne yapacağını alırsın; sonra istediğin gibi değiştirirsin.</DialogDescription></DialogHeader>
  <div className="wz-progress"><p><b>Adım {step+1} / {steps.length}</b> · {steps[step]}</p><div className="wz-bar" aria-hidden="true"><i style={{width:`${(step+1)/steps.length*100}%`}}/></div></div>
  {step===0&&<div className="wizard-body">
   <section className="wz-card"><h3>Hangi sınıftasın?</h3><Chips label="Sınıf" value={cfg.grade} onChange={setGrade} options={GRADES.map(g=>({id:g,label:gradeLabel(g)}))}/>
    <p className="muted small">{cfg.grade==='9'?'Yalnız 9. sınıf konuları gelir.':cfg.grade==='10'?'Ağırlık 10. sınıfta; 9. sınıftan arada tekrar gelir.':cfg.grade==='11'?'Yeni konular ağırlıklı; TYT tekrarı eskisinden sık gelir.':'15 Aralık\'a kadar TYT ağırlıklı, sonrasında AYT ağırlıklı ilerler.'}</p></section>
   {upper&&<section className="wz-card"><h3>Alanın <small>AYT dersleri buna göre seçilir</small></h3><Chips label="Alan" value={cfg.track} onChange={(v:Track)=>set('track',v)} options={TRACKS.map(t=>({id:t.id,label:t.label}))}/></section>}
   <section className="wz-card"><h3>Şu anki netin <small>bilmiyorsan boş bırak</small></h3><div className="form-grid"><label>TYT neti<input inputMode="decimal" placeholder="Örn. 62" value={cfg.tytNet||''} onChange={e=>set('tytNet',num(e.target.value))}/></label>{upper&&<label>AYT neti<input inputMode="decimal" placeholder="Örn. 28" value={cfg.aytNet||''} onChange={e=>set('aytNet',num(e.target.value))}/></label>}</div>
    <p className="muted small">{!plan&&(lastNet('TYT')||lastNet('AYT'))?'Son denemelerinden dolduruldu; değiştirebilirsin. ':''}TYT netin düşükse temel konulara daha çok yer ayrılır.</p></section></div>}
  {step===1&&<div className="wizard-body">
   <section className="wz-card"><h3>Hangi derslerde eksiğin var? <small>istediğin kadar seç, geçebilirsin</small></h3><div className="flex-chip-row wrap">{subjects.map(sub=><button type="button" key={sub} aria-pressed={cfg.weakSubjects.includes(sub)} className={'flex-chip small'+(cfg.weakSubjects.includes(sub)?' on':'')} onClick={()=>toggleSubject(sub)}><b>{sub}</b></button>)}</div>
    <p className="muted small">Seçtiğin derslere daha sık görev düşer. Hiçbirini seçmezsen plan derslere dengeli yayılır.</p></section>
   {cfg.weakSubjects.length>0&&<section className="wz-card"><h3>Eksik konular <small>isteğe bağlı · {cfg.weakTopics.length} seçili</small></h3>
    {cfg.weakSubjects.map(sub=>{const opts=topicOptions(sub).filter(o=>Number(o.grade)<=maxGrade);const n=cfg.weakTopics.filter(t=>t.subject===sub).length;return <details key={sub} className="flex-topics"><summary>{sub}<small>{n?`${n} seçili`:`${opts.length} konu`}</small></summary>
     <ul>{opts.map(o=><li key={o.value+o.grade}><label className="switch-line"><input type="checkbox" checked={cfg.weakTopics.some(t=>t.subject===sub&&t.topic===o.value)} onChange={()=>toggleTopic(sub,o.value)}/><span><b>{o.value}</b><small>{o.gradeLabel}</small></span></label></li>)}</ul></details>})}
    <p className="muted small">İşaretlediğin konular planın ilk haftalarına öncelikle yerleşir.</p></section>}</div>}
  {step===2&&<div className="wizard-body">
   <section className="wz-card"><h3>Haftada kaç yeni konu dinlemek istersin?</h3><Chips label="Haftalık yeni konu" value={cfg.topicsPerWeek} onChange={v=>set('topicsPerWeek',v)} options={[2,3,5,7,10].map(n=>({id:n,label:String(n)}))}/><p className="muted small">Her yeni konu: konu anlatımı + soru çözümü.</p></section>
   <section className="wz-card"><h3>Günde kaç görev?</h3><Chips label="Günlük görev" value={cfg.dailyTasks} onChange={v=>set('dailyTasks',v)} options={[2,3,4,5,6].map(n=>({id:n,label:String(n)}))}/>
    <h3 className="flex-sub">Hangi günler çalışacaksın?</h3><DayPills value={cfg.days} onChange={v=>set('days',v.length?v:cfg.days)}/></section>
   <section className="wz-card"><label className="switch-line"><input type="checkbox" checked={cfg.review.enabled} onChange={e=>set('review',{...cfg.review,enabled:e.target.checked})}/><span><b>Dinlediğim konular tekrar gelsin</b><small>Konudan birkaç gün sonra kısa tekrar görevi eklenir.</small></span></label>
    {cfg.review.enabled&&<Chips label="Tekrar sıklığı" value={cfg.review.spacing} onChange={(v:Spacing)=>set('review',{...cfg.review,spacing:v})} options={(Object.keys(SPACINGS) as Spacing[]).map(k=>({id:k,label:SPACINGS[k].label,hint:SPACINGS[k].days.join(' · ')+'. gün'}))}/>}</section>
   {upper&&<section className="wz-card"><h3>TYT / AYT dengesi</h3><Chips label="Denge" value={cfg.balance} onChange={(v:Balance)=>set('balance',v)} options={[{id:'auto',label:'Otomatik',hint:'önerilen'},{id:'tyt',label:'Daha çok TYT'},{id:'ayt',label:'Daha çok AYT'}]}/><p className="muted small">{balanceNote(cfg,localToday())}</p></section>}</div>}
  <div className="wizard-nav"><button type="button" className="secondary" disabled={step===0||busy} onClick={()=>setStep(x=>x-1)}><ArrowLeft size={16}/> Geri</button>{step<steps.length-1?<button type="button" className="primary" onClick={()=>setStep(x=>x+1)}>Devam et <ArrowRight size={16}/></button>:<button type="button" className="primary" disabled={busy} onClick={()=>void save()}>{busy?<LoaderCircle className="spin" size={16}/>:<Check size={16}/>} {plan?'Kaydet':'Planı oluştur'}</button>}</div>
 </DialogContent></Dialog>}
