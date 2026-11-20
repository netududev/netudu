// Esnek görev planı motoru (saf mantık, saat yok): sınıfa, eksiklere, netlere ve tekrar tercihine göre günlük görev listesi üretir.
// TYT'ye sabit değildir. Ağırlıklar sınıfa ve tarihe göre kayar (bkz. poolsFor). Eski saatli program (scheduler.ts) ayrı kalır.
// Üretilen görevler veritabanında saklanır ve öğrenci tarafından serbestçe düzenlenir; yeniden üretim yalnız gelecekteki,
// yapılmamış ve elle değiştirilmemiş görevleri yeniler.
import {mebTopics,topicOptions} from '../meb-topics';
import {addDays,daysBetween,dayKeyOf} from './dates';
import {ALL_DAYS,type DayKey} from './curriculum';

export type Grade='9'|'10'|'11'|'12'|'Mezun';
export type Track='sayisal'|'ea'|'sozel'|'dil';
export type Balance='auto'|'tyt'|'ayt';
export type Spacing='sik'|'normal'|'seyrek';
export type TaskKind='konu'|'tekrar'|'soru'|'paragraf'|'deneme'|'analiz'|'ozel';
export type FlexTask={id:string;date:string;kind:TaskKind;exam:'TYT'|'AYT'|'';grade:string;subject:string;topic:string;title:string;detail:string;done:boolean;manual:boolean;pool?:string;from?:string;step?:number};
export type FlexConfig={
 grade:Grade;track:Track;tytNet:number;aytNet:number;gradeNet:number;
 weakSubjects:string[];weakTopics:{subject:string;topic:string}[];
 topicsPerWeek:number;dailyTasks:number;days:DayKey[];
 review:{enabled:boolean;spacing:Spacing};
 balance:Balance;startDate:string;examDate:string};
export type FlexPlan={config:FlexConfig;tasks:FlexTask[];horizon:string;updated_at?:string};

export {addDays};
export const GRADES:Grade[]=['9','10','11','12','Mezun'];
export const TRACKS:{id:Track;label:string}[]=[{id:'sayisal',label:'Sayısal'},{id:'ea',label:'Eşit Ağırlık'},{id:'sozel',label:'Sözel'},{id:'dil',label:'Dil'}];
export const SPACINGS:Record<Spacing,{label:string;days:number[]}>={sik:{label:'Sık',days:[1,3,7,14,30]},normal:{label:'Normal',days:[2,7,21]},seyrek:{label:'Seyrek',days:[7,30]}};
export const DEFAULT_DAYS:DayKey[]=['Pzt','Sal','Çar','Per','Cum','Cmt'];
export const LIMITS={maxTasks:1800,horizonDays:35,minAhead:14,maxPerDay:24};

const DIL_TOPICS=['Kelime çalışması','Okuma parçaları','Cümle tamamlama','Paragraf soruları','Dil bilgisi'];
const AYT_SUBJECTS:Record<Track,string[]>={sayisal:['Matematik','Fizik','Kimya','Biyoloji'],ea:['Matematik','Türk Dili ve Edebiyatı','Tarih','Coğrafya'],sozel:['Türk Dili ve Edebiyatı','Tarih','Coğrafya','Felsefe','Din Kültürü ve Ahlak Bilgisi'],dil:['Türk Dili ve Edebiyatı','Yabancı Dil']};
// TYT soru sayılarına göre ders ağırlığı (Türkçe ve Matematik 40'ar soru; fen ve sosyal dersleri 5-7 soru)
const TYT_WEIGHT:Record<string,number>={'Türk Dili ve Edebiyatı':3,Matematik:3,Fizik:1.2,Kimya:1.2,Biyoloji:1,Tarih:1,Coğrafya:1,Felsefe:1,'Din Kültürü ve Ahlak Bilgisi':1};
export const ALL_SUBJECTS=Object.keys(mebTopics);

// ---------- yardımcılar ----------
const uid=()=>{const c=(globalThis as any).crypto;return c?.randomUUID?c.randomUUID().slice(0,12):Math.random().toString(36).slice(2,14)};
const clamp=(n:number,a:number,b:number)=>Math.min(b,Math.max(a,Number.isFinite(n)?n:a));
const mmdd=(date:string)=>Number(date.slice(5,7))*100+Number(date.slice(8,10));
const isGrade=(g:unknown):g is Grade=>GRADES.includes(g as Grade);
// Pazartesiye göre hafta başlangıcı
export const weekStart=(date:string)=>{const i=ALL_DAYS.indexOf(dayKeyOf(date));return addDays(date,-i)};

export function defaultFlexConfig(today:string,grade:string='12'):FlexConfig{const g:Grade=isGrade(grade)?grade:'12';
 const preset={'9':[3,2],'10':[4,3],'11':[5,3],'12':[6,4],Mezun:[8,5]}[g];
 return {grade:g,track:'sayisal',tytNet:0,aytNet:0,gradeNet:0,weakSubjects:[],weakTopics:[],topicsPerWeek:preset[0],dailyTasks:preset[1],days:[...DEFAULT_DAYS],review:{enabled:true,spacing:'normal'},balance:'auto',startDate:today,examDate:''}}

export function normalizeFlexConfig(raw:unknown,today=new Date().toISOString().slice(0,10)):FlexConfig{
 const r=(raw&&typeof raw==='object'?raw:{}) as Record<string,any>;const def=defaultFlexConfig(today,r.grade);
 const days=Array.isArray(r.days)?ALL_DAYS.filter(d=>r.days.includes(d)):def.days;
 const subj=(Array.isArray(r.weakSubjects)?r.weakSubjects:[]).filter((s:any)=>typeof s==='string'&&ALL_SUBJECTS.includes(s));
 const topics=(Array.isArray(r.weakTopics)?r.weakTopics:[]).filter((t:any)=>t&&typeof t.subject==='string'&&typeof t.topic==='string'&&topicOptions(t.subject).some(o=>o.value===t.topic)).slice(0,80).map((t:any)=>({subject:t.subject,topic:t.topic}));
 const rv=(r.review&&typeof r.review==='object'?r.review:{}) as Record<string,any>;
 return {grade:def.grade,track:TRACKS.some(t=>t.id===r.track)?r.track:def.track,tytNet:clamp(Number(r.tytNet),0,120),aytNet:clamp(Number(r.aytNet),0,160),gradeNet:clamp(Number(r.gradeNet),0,120),
  weakSubjects:[...new Set<string>(subj)],weakTopics:topics,
  topicsPerWeek:Math.round(clamp(r.topicsPerWeek===undefined?def.topicsPerWeek:Number(r.topicsPerWeek),1,21)),dailyTasks:Math.round(clamp(r.dailyTasks===undefined?def.dailyTasks:Number(r.dailyTasks),1,8)),
  days:days.length?days:def.days,review:{enabled:rv.enabled===undefined?true:!!rv.enabled,spacing:(rv.spacing in SPACINGS?rv.spacing:'normal') as Spacing},
  balance:(['auto','tyt','ayt'].includes(r.balance)?r.balance:'auto') as Balance,
  startDate:typeof r.startDate==='string'&&/^20\d{2}-\d{2}-\d{2}$/.test(r.startDate)?r.startDate:today,
  examDate:typeof r.examDate==='string'&&/^20\d{2}-\d{2}-\d{2}$/.test(r.examDate)?r.examDate:''}}

// ---------- sınıfa ve tarihe göre TYT/AYT dengesi ----------
// 9: yalnız sınıf düzeyi. 10: sınıf düzeyi + nadiren 9. sınıf tekrarı. 11: yeni (11. sınıf/AYT) konular ağırlıklı, TYT tekrarı eskisinden sık.
// 12/Mezun: 15 Aralık'a kadar TYT ağırlıklı, sonrasında AYT ağırlıklı (Mart'tan itibaren daha da fazla).
export type Pool={id:string;label:string;grades:string[];exam:'TYT'|'AYT'|'';weight:number;revisit:boolean};
export function tytShareFor(cfg:FlexConfig,date:string):number{
 let t:number;const md=mmdd(date);
 if(cfg.grade==='9'||cfg.grade==='10')t=100;
 else if(cfg.grade==='11')t=40;
 else{const mezun=cfg.grade==='Mezun';t=md>=1215||md<=630?(md>=1215||md<=228?40:35):(mezun?55:65);
  // net durumu: TYT neti düşükse temel güçlenir, çok yüksekse AYT'ye daha fazla yer açılır
  if(cfg.tytNet>0&&cfg.tytNet<60)t+=10;else if(cfg.tytNet>=90)t-=10}
 if(cfg.grade!=='9'&&cfg.grade!=='10'){if(cfg.balance==='tyt')t+=15;else if(cfg.balance==='ayt')t-=15}
 return clamp(t,15,85)}
export function poolsFor(cfg:FlexConfig,date:string):Pool[]{const g=cfg.grade;
 if(g==='9')return [{id:'okul',label:'9. sınıf',grades:['9'],exam:'TYT',weight:100,revisit:false}];
 if(g==='10')return [{id:'okul',label:'10. sınıf',grades:['10'],exam:'TYT',weight:85,revisit:false},{id:'eski',label:'9. sınıf tekrarı',grades:['9'],exam:'TYT',weight:15,revisit:true}];
 const t=tytShareFor(cfg,date);
 return [{id:'yeni',label:g==='11'?'11. sınıf':'AYT',grades:g==='11'?['11']:['11','12'],exam:'AYT',weight:100-t,revisit:false},{id:'tyt',label:'TYT',grades:['9','10'],exam:'TYT',weight:t,revisit:false}]}

// Programın şu anki dengesini ve dönemini kullanıcıya açıklar (arayüzde gösterilir)
export function balanceNote(cfg:FlexConfig,date:string){const t=tytShareFor(cfg,date);
 if(cfg.grade==='9'||cfg.grade==='10')return cfg.grade==='9'?'Sınıf düzeyinde ilerliyorsun: yalnız 9. sınıf konuları.':'Ağırlık 10. sınıf konularında; 9. sınıftan arada tekrar gelir.';
 if(cfg.grade==='11')return `Yeni konular (%${100-t}) ağırlıklı; TYT tekrarı %${t}.`;
 const md=mmdd(date);const when=md>=1215||md<=630?(md>=1215||md<=228?'Aralık ortasından sonra AYT ağırlıklı dönem':'Mart sonrası AYT ağırlıklı dönem'):'15 Aralık\'a kadar TYT ağırlıklı dönem';
 return `${when}: %${t} TYT, %${100-t} AYT.`}

// ---------- konu havuzu ----------
type Cand={subject:string;topic:string;grade:string};
const subjectsFor=(cfg:FlexConfig,pool:Pool):string[]=>{if(pool.exam==='AYT'&&cfg.grade!=='11')return AYT_SUBJECTS[cfg.track];if(pool.exam==='AYT'&&cfg.grade==='11')return [...new Set([...AYT_SUBJECTS[cfg.track],...ALL_SUBJECTS])];return ALL_SUBJECTS};
function candidates(cfg:FlexConfig,pool:Pool):Cand[]{const out:Cand[]=[];
 for(const s of subjectsFor(cfg,pool)){
  if(s==='Yabancı Dil'){if(pool.exam==='AYT')for(const t of DIL_TOPICS)out.push({subject:s,topic:t,grade:'12'});continue}
  for(const o of topicOptions(s))if(pool.grades.includes(o.grade))out.push({subject:s,topic:o.value,grade:o.grade})}
 return out}
const keyOf=(c:Cand)=>`${c.subject}|${c.topic}`;
const baseWeight=(cfg:FlexConfig,subject:string)=>(TYT_WEIGHT[subject]??1)*(cfg.weakSubjects.includes(subject)?2.5:1);
const questionCount=(cfg:FlexConfig)=>{const base={'9':20,'10':25,'11':30,'12':35,Mezun:40}[cfg.grade];const net=cfg.grade==='9'||cfg.grade==='10'?(cfg.gradeNet||cfg.tytNet):cfg.tytNet;return net>0&&net<40?Math.max(15,base-5):base};

// ---------- görev oluşturma ----------
const mk=(date:string,t:Partial<FlexTask>&Pick<FlexTask,'kind'|'title'>):FlexTask=>({id:uid(),date,exam:'',grade:'',subject:'',topic:'',detail:'',done:false,manual:false,...t});

// Haftanın deneme günü: çalışılan son gün. Sınıfa ve döneme göre sıklık ve tür değişir.
function denemeFor(cfg:FlexConfig,date:string):'TYT'|'AYT'|null{
 if(cfg.grade==='9')return null;
 const ws=weekStart(date);const wk=Math.floor(daysBetween('2020-01-06',ws)/7);const md=mmdd(date);
 if(cfg.grade==='10')return wk%4===3?'TYT':null;
 if(cfg.grade==='11'){if(wk%2!==1)return null;return md>=301&&md<=630&&Math.floor(wk/2)%2===1?'AYT':'TYT'}
 const t=tytShareFor(cfg,date);if(t>=55)return wk%3===2?'AYT':'TYT';return wk%2===0?'AYT':'TYT'}
const lastActive=(cfg:FlexConfig,date:string)=>{const ws=weekStart(date);for(let i=6;i>=0;i--){const d=addDays(ws,i);if(cfg.days.includes(dayKeyOf(d)))return d}return ''};

// from..to arasındaki günler için görev üretir; mevcut görevleri (yapılmış, elle eklenmiş, taşınmış) korur ve yenilerini ekler.
export function generate(cfg:FlexConfig,existing:FlexTask[],from:string,to:string):FlexTask[]{
 const all=[...existing];const added:FlexTask[]=[];const add=(t:FlexTask)=>{all.push(t);added.push(t);return t};
 const intervals=SPACINGS[cfg.review.spacing].days;const q=questionCount(cfg);
 // kapsanan konular: herhangi bir tarihteki 'konu' görevleri
 const covered=new Map<string,string>();for(const t of all)if(t.pool){const k=`${t.subject}|${t.topic}`;if(t.date>(covered.get(k)||''))covered.set(k,t.date)}
 const poolCount=new Map<string,number>();for(const t of all)if(t.pool&&t.date>=addDays(from,-14)&&t.date<from)poolCount.set(t.pool,(poolCount.get(t.pool)||0)+1);
 const weakLeft=()=>cfg.weakTopics.filter(w=>!covered.has(`${w.subject}|${w.topic}`));
 for(let date=from;date<=to;date=addDays(date,1)){
  if(!cfg.days.includes(dayKeyOf(date)))continue;
  const have=all.filter(t=>t.date===date);let used=have.length;
  // Deneme günü hafif tutulur: deneme + en çok bir ek görev, yeni konu yok
  const dn=lastActive(cfg,date)===date?denemeFor(cfg,date):null;
  const cap=dn?Math.min(cfg.dailyTasks,2):cfg.dailyTasks;if(used>=cap)continue;
  const room=()=>cap-used;
  // 1) deneme ve analiz (sabit)
  if(dn&&!have.some(t=>t.kind==='deneme')&&room()>0){add(mk(date,{kind:'deneme',exam:dn,title:`${dn} denemesi`,detail:dn==='AYT'&&cfg.track!=='sayisal'?'Alanına uygun AYT denemesi. Süreni tut, netini Denemeler\'e gir.':'Süreni tut, bitince netini Denemeler\'e gir.'}));used++}
  const prevWeekDeneme=all.find(t=>t.kind==='deneme'&&t.date<date&&t.date>=addDays(date,-6)&&!all.some(a=>a.kind==='analiz'&&a.from===t.id));
  if(prevWeekDeneme&&room()>0){add(mk(date,{kind:'analiz',exam:prevWeekDeneme.exam,title:'Deneme analizi',detail:'Yanlışlarını deftere ekle, sebebini yaz, eksik konuları işaretle.',from:prevWeekDeneme.id}));used++}
  // 2) vadesi gelen tekrarlar (kayan: yoğun günde bir sonraki çalışma gününe kalır)
  if(cfg.review.enabled){const cap2=cap>=5?2:1;let n=have.filter(t=>t.kind==='tekrar').length;
   const dues:{src:FlexTask;step:number;due:string}[]=[];
   for(const c of all)if(c.kind==='konu'&&(c.done||c.date>=from))intervals.forEach((k,step)=>{const due=addDays(c.date,k);if(due<=date&&due>=addDays(date,-10)&&!all.some(a=>a.kind==='tekrar'&&a.from===c.id&&a.step===step))dues.push({src:c,step,due})});
   dues.sort((a,b)=>a.due.localeCompare(b.due)||a.step-b.step);
   for(const d of dues){if(n>=cap2||room()<=0)break;
    add(mk(date,{kind:'tekrar',exam:d.src.exam,grade:d.src.grade,subject:d.src.subject,topic:d.src.topic,title:`Tekrar: ${d.src.topic}`,detail:`${d.src.subject} · ${d.step===0?'hızlı gözden geçir + 10 soru':'kendini test et: 15 soru'}`,from:d.src.id,step:d.step}));used++;n++}}
  // 3) yeni konular (haftalık kotanın o güne düşen payı)
  const act=ALL_DAYS.filter(d=>cfg.days.includes(d));const idx=act.indexOf(dayKeyOf(date));const nNew=dn?0:Math.floor((idx+1)*cfg.topicsPerWeek/act.length)-Math.floor(idx*cfg.topicsPerWeek/act.length);
  const todaysNew=have.filter(t=>t.pool).length;
  for(let k=todaysNew;k<nNew&&room()>0;k++){const t=pickTopic(cfg,date,covered,poolCount,weakLeft(),all);if(!t)break;
   const lvl=t.grade?`${t.grade}. sınıf`:'';
   add(mk(date,{kind:t.wrapped?'tekrar':'konu',exam:t.exam,grade:t.grade,subject:t.subject,topic:t.topic,title:t.wrapped?`Tekrar: ${t.topic}`:t.topic,detail:`${t.subject}${lvl&&cfg.grade!==t.grade?' · '+lvl+' konusu':''} · ${t.wrapped?'konu tekrarı':'konu anlatımı'} + ${q} soru`,pool:t.pool}));
   covered.set(keyOf(t),date);poolCount.set(t.pool,(poolCount.get(t.pool)||0)+1);used++}
  // 4) kalan kapasite: paragraf rutini ve eksik derslerde soru pekiştirme
  const tytActive=poolsFor(cfg,date).some(p=>p.exam==='TYT'&&p.weight>0);
  if(room()>0&&cfg.grade!=='9'&&tytActive&&!all.some(t=>t.date===date&&t.kind==='paragraf')&&(idx%2===0||cfg.grade==='12'||cfg.grade==='Mezun')){add(mk(date,{kind:'paragraf',exam:'TYT',subject:'Türk Dili ve Edebiyatı',title:'Paragraf rutini',detail:`${cfg.grade==='10'?15:20} paragraf sorusu · süre tut`}));used++}
  let guard=0;while(room()>0&&guard++<6){const s=pickPractice(cfg,date,all);if(!s)break;add(mk(date,{kind:'soru',exam:s.exam,grade:s.grade,subject:s.subject,topic:s.topic,title:`${s.subject}: soru çözümü`,detail:`${s.topic} · ${q} soru`}));used++}
 }
 return added}

type Picked=Cand&{pool:string;exam:'TYT'|'AYT'|'';wrapped:boolean};
// Havuz seçimi: eksik konu havuzu (varsa) + sınıf havuzları; ağırlık oranına en çok yaklaşan havuz seçilir. Havuz içinde ders ağırlıklı, konu sıralı gider.
function pickTopic(cfg:FlexConfig,date:string,covered:Map<string,string>,poolCount:Map<string,number>,weakLeft:{subject:string;topic:string}[],all:FlexTask[]):Picked|null{
 const pools=poolsFor(cfg,date).map(p=>({...p}));
 if(weakLeft.length)for(const p of pools)p.weight*=0.7;
 const list=weakLeft.length?[...pools,{id:'eksik',label:'Eksik konu',grades:[] as string[],exam:'' as const,weight:30,revisit:false}]:pools;
 const total=[...poolCount.values()].reduce((a,b)=>a+b,0)+1;const wsum=list.reduce((a,p)=>a+p.weight,0)||1;
 const order=list.filter(p=>p.weight>0).sort((a,b)=>(b.weight/wsum*total-(poolCount.get(b.id)||0))-(a.weight/wsum*total-(poolCount.get(a.id)||0)));
 for(const p of order){
  if(p.id==='eksik'){const w=weakLeft[0];const meta=topicOptions(w.subject).find(o=>o.value===w.topic);return {subject:w.subject,topic:w.topic,grade:meta?.grade||'',pool:'eksik',exam:meta&&Number(meta.grade)>=11?'AYT':'TYT',wrapped:false}}
  const cands=candidates(cfg,p);if(!cands.length)continue;
  const open=cands.filter(c=>!covered.has(keyOf(c)));
  if(open.length){
   // ders seçimi: ağırlığa göre açık sayaç (bu havuzda son 21 günde ders başına seçilenler)
   const recent=all.filter(t=>t.kind!=='soru'&&t.pool===p.id&&t.date>=addDays(date,-21));const cnt=new Map<string,number>();for(const t of recent)cnt.set(t.subject,(cnt.get(t.subject)||0)+1);
   const subs=[...new Set(open.map(c=>c.subject))];const ws=subs.reduce((a,s)=>a+baseWeight(cfg,s),0);const tot=recent.length+1;
   subs.sort((a,b)=>(baseWeight(cfg,b)/ws*tot-(cnt.get(b)||0))-(baseWeight(cfg,a)/ws*tot-(cnt.get(a)||0)));
   const c=open.find(x=>x.subject===subs[0])!;return {...c,pool:p.id,exam:p.exam,wrapped:false}}
  // havuzdaki tüm konular işlendi: en eski işlenen konuya dön (konu tekrarı turu)
  const oldest=[...cands].sort((a,b)=>(covered.get(keyOf(a))||'').localeCompare(covered.get(keyOf(b))||''))[0];
  return {...oldest,pool:p.id,exam:p.exam,wrapped:true}}
 return null}
function pickPractice(cfg:FlexConfig,date:string,all:FlexTask[]):{subject:string;topic:string;grade:string;exam:'TYT'|'AYT'|''}|null{
 const since=addDays(date,-10);const recent=all.filter(t=>(t.kind==='konu'||t.kind==='tekrar')&&t.date>=since&&t.date<=date&&t.subject);
 // aynı gün aynı dersten ikinci soru görevi ve son 4 günde çalışılmış konular elenir
 const usedSubj=new Set(all.filter(t=>t.date===date&&t.subject).map(t=>t.subject));
 const lastSoru=new Set(all.filter(t=>t.kind==='soru'&&t.date>=addDays(date,-4)&&t.date<=date).map(t=>`${t.subject}|${t.topic}`));
 const ok=recent.filter(t=>!usedSubj.has(t.subject)&&!lastSoru.has(`${t.subject}|${t.topic}`));
 const weak=ok.filter(t=>cfg.weakSubjects.includes(t.subject));const pool=weak.length?weak:ok;
 if(!pool.length)return null;
 const pick=pool[Math.abs(daysBetween('2020-01-06',date)+usedSubj.size)%pool.length];return {subject:pick.subject,topic:pick.topic,grade:pick.grade,exam:pick.exam}}

// ---------- plan yaşam döngüsü ----------
export function buildPlan(cfg:FlexConfig,today:string):FlexPlan{const horizon=addDays(cfg.startDate>today?cfg.startDate:today,LIMITS.horizonDays);
 return {config:cfg,tasks:generate(cfg,[],cfg.startDate,horizon),horizon}}
// Ufku genişletir (yalnız eksik günleri ekler); uzak gelecekte sınav tarihinden sonrası üretilmez.
export function extendPlan(plan:FlexPlan,today:string):FlexPlan{const goal=addDays(today,LIMITS.horizonDays);let to=goal;if(plan.config.examDate&&plan.config.examDate<to)to=plan.config.examDate;
 if(plan.horizon>=to||plan.tasks.length>=LIMITS.maxTasks)return plan;
 return {...plan,horizon:to,tasks:[...plan.tasks,...generate(plan.config,plan.tasks,addDays(plan.horizon,1),to)]}}
// Yeniden üret: bugünden itibaren yapılmamış ve elle değiştirilmemiş görevleri atar, ayarlara göre yeniler. Yapılanlar ve elle düzenlenenler kalır.
export function regeneratePlan(plan:FlexPlan,cfg:FlexConfig,today:string):FlexPlan{
 const keep=plan.tasks.filter(t=>t.done||t.manual||t.date<today);const ids=new Set(keep.map(t=>t.id));
 const clean=keep.filter(t=>!t.from||ids.has(t.from));
 const horizon=addDays(today,LIMITS.horizonDays);const to=cfg.examDate&&cfg.examDate<horizon?cfg.examDate:horizon;
 return {config:cfg,horizon,tasks:[...clean,...generate(cfg,clean,today,to>=today?to:today)]}}

// ---------- görünüm yardımcıları ----------
export const tasksOn=(plan:FlexPlan,date:string)=>plan.tasks.filter(t=>t.date===date).sort((a,b)=>Number(a.done)-Number(b.done)||order(a.kind)-order(b.kind));
const order=(k:TaskKind)=>({deneme:0,konu:1,tekrar:2,soru:3,paragraf:4,analiz:5,ozel:6}[k]);
export const KIND_LABEL:Record<TaskKind,string>={konu:'Yeni konu',tekrar:'Tekrar',soru:'Soru',paragraf:'Paragraf',deneme:'Deneme',analiz:'Analiz',ozel:'Görev'};
export function dayProgress(plan:FlexPlan,date:string){const t=plan.tasks.filter(x=>x.date===date);return {total:t.length,done:t.filter(x=>x.done).length}}
