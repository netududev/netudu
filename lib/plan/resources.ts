// Kaynaklar: soru bankası / kitap (test, sayfa) ve YouTube oynatma listesi. Saf mantık (veritabanı, ağ ve framework yok).
// İlerleme takvimden bağımsız bir sayaçtır: kitapta `done` (tamamlanan birim), oynatma listesinde `watched` (izlenen videolar, sırasız).
// "Bugünün işi" sıradaki perDay birimdir; `log` bugün tamamlanan birimleri tutar, böylece "bitirdim" dedikten sonra bugünün aralığı kaymaz.
import {ALL_DAYS,type DayKey} from './curriculum';
import {addDays,daysBetween,dayKeyOf} from './dates';

export type PlaylistItem={id:string;title:string};
export type ResourceKind='book'|'playlist';
export type ResourceUnit='test'|'sayfa'|'video';
export type Resource={
 id:string;kind:ResourceKind;name:string;subject:string;unit:ResourceUnit;
 total:number;done:number;perDay:number;minPerUnit:number;days:DayKey[];
 listId?:string;items?:PlaylistItem[];watched?:number[];
 log?:{date:string;units:number[]};
};
export type ResourceInput={kind:ResourceKind;name:string;subject?:string;unit?:ResourceUnit;total:number;done?:number;perDay:number;minPerUnit?:number;days?:DayKey[];listId?:string;items?:PlaylistItem[]};
export type ProgressOp={mode:'delta';delta:number}|{mode:'set';position:number}|{mode:'toggle';index:number};
export type ResourceTask={id:string;kind:ResourceKind;name:string;subject:string;unit:ResourceUnit;units:number[];label:string;minutes:number;done:boolean;start?:string;end?:string};

export const LIMITS={resources:30,total:2000,perDay:200,minPerUnit:600,items:300,title:200,name:120,subject:60,log:400};
export const DEFAULT_MIN:Record<ResourceUnit,number>={test:25,sayfa:6,video:40};
export const UNIT_TITLE:Record<ResourceUnit,string>={test:'Test',sayfa:'Sayfa',video:'Video'};
export const MIN_BLOCK=15,MAX_BLOCK=240;
export const LIST_ID=/^[A-Za-z0-9_-]{10,64}$/;
export const VIDEO_ID=/^[A-Za-z0-9_-]{11}$/;
const HOSTS=new Set(['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com','youtu.be']);
const DATE=/^20\d{2}-\d{2}-\d{2}$/;
const clamp=(n:number,lo:number,hi:number)=>Math.min(hi,Math.max(lo,n));
const int=(v:unknown,lo:number,hi:number,fallback:number)=>{const n=typeof v==='number'?v:typeof v==='string'&&v.trim()!==''?Number(v):NaN;return Number.isFinite(n)?clamp(Math.trunc(n),lo,hi):fallback};
// Aralık dışı değer kırpılmaz, elenir (ör. kaynakta olmayan birim numarası)
const unitList=(v:unknown,total:number)=>[...new Set((Array.isArray(v)?v:[]).filter((x:unknown):x is number=>typeof x==='number'&&Number.isInteger(x)&&x>=1&&x<=total))].sort((a,b)=>a-b);
const uniqDays=(days:DayKey[])=>ALL_DAYS.filter(d=>days.includes(d));

// ---------- oynatma listesi bağlantısı ----------
// Yalnız youtube.com / youtu.be / m. / music. alan adları; list kimliği 10-64 karakter [A-Za-z0-9_-]. Şemasız girişe https eklenir.
export function parsePlaylistUrl(input:unknown):{listId:string;videoId?:string}|null{
 if(typeof input!=='string')return null;const t=input.trim();if(!t||t.length>300)return null;
 let u:URL;try{u=new URL(/^https?:\/\//i.test(t)?t:'https://'+t)}catch{return null}
 if((u.protocol!=='https:'&&u.protocol!=='http:')||u.username||u.password||!HOSTS.has(u.hostname.toLowerCase()))return null;
 const listId=u.searchParams.get('list')||'';if(!LIST_ID.test(listId))return null;
 const short=u.hostname.toLowerCase()==='youtu.be';if(!short&&u.pathname!=='/playlist'&&u.pathname!=='/watch')return null;
 const v=short?u.pathname.split('/')[1]||'':u.searchParams.get('v')||'';
 return {listId,...(VIDEO_ID.test(v)?{videoId:v}:{})}}
// "YouTube'da devam et" bağlantısı: video kimliği biliniyorsa watch?v=ID&list=LIST, yoksa watch?list=LIST&index=N
export function continueUrl(r:Resource,index:number):string{if(r.kind!=='playlist'||!r.listId||!LIST_ID.test(r.listId))return '';const id=r.items?.[index-1]?.id;
 return id&&VIDEO_ID.test(id)?`https://www.youtube.com/watch?v=${id}&list=${r.listId}`:`https://www.youtube.com/watch?list=${r.listId}&index=${Math.max(1,index)}`}

// ---------- ilerleme okuma ----------
export const doneCount=(r:Resource)=>r.kind==='playlist'?(r.watched||[]).length:r.done;
export const isFinished=(r:Resource)=>r.total>0&&doneCount(r)>=r.total;
export const percentOf=(r:Resource)=>r.total?Math.round(doneCount(r)/r.total*100):0;
const watchedSet=(r:Resource)=>new Set(r.watched||[]);
export const isUnitDone=(r:Resource,i:number)=>r.kind==='playlist'?(r.watched||[]).includes(i):i<=r.done;
// Kaldığın yer: tamamlanmamış ilk birim (1 tabanlı); hepsi bittiyse null
export function resumeIndex(r:Resource):number|null{if(r.kind==='book')return r.done<r.total?r.done+1:null;const w=watchedSet(r);for(let i=1;i<=r.total;i++)if(!w.has(i))return i;return null}
// Sıradaki tamamlanmamış `count` birim
export function upcoming(r:Resource,count=r.perDay):number[]{const out:number[]=[];if(r.kind==='book'){for(let i=r.done+1;i<=r.total&&out.length<count;i++)out.push(i);return out}
 const w=watchedSet(r);for(let i=1;i<=r.total&&out.length<count;i++)if(!w.has(i))out.push(i);return out}
export function titleOf(r:Resource,index:number){return r.items?.[index-1]?.title||''}

// ---------- etiketler ----------
// "Test 13–15", "Sayfa 41–60", "Video 7", süreksiz birimlerde "Video 3, 7, 9 +2"
export function spanLabel(r:Resource,units:number[]):string{const name=UNIT_TITLE[r.unit];if(!units.length)return name;const a=units[0],b=units[units.length-1];
 if(units.length===1)return `${name} ${a}`;if(b-a===units.length-1)return `${name} ${a}–${b}`;const head=units.slice(0,3).join(', ');return `${name} ${head}${units.length>3?` +${units.length-3}`:''}`}
export const taskMinutes=(r:Resource,count:number)=>clamp(Math.round(count*r.minPerUnit),MIN_BLOCK,MAX_BLOCK);
export const kindTag=(r:Resource)=>r.kind==='book'?'Soru bankası':'Video';
export const kindTitle=(r:Resource)=>r.kind==='book'?'Soru bankası':'Oynatma listesi';

// ---------- bugünün işi ve gelecek tahmini ----------
const todayLog=(r:Resource,today:string)=>r.log&&r.log.date===today?r.log.units:[];
// Kuyruktaki [from, from+count) aralığı. useLog: bugün tamamlananlar kuyruğun başında sayılır (bugünün kotası kaymasın).
function chunk(r:Resource,today:string,from:number,count:number,useLog:boolean):number[]{
 if(r.kind==='book'){const n=useLog?Math.min(todayLog(r,today).length,r.done):0;const start=r.done-n;const out:number[]=[];for(let i=start+from+1;i<=r.total&&out.length<count;i++)out.push(i);return out}
 const w=watchedSet(r),lg=new Set(useLog?todayLog(r,today):[]);const q:number[]=[];const need=from+count;for(let i=1;i<=r.total&&q.length<need;i++)if(!w.has(i)||lg.has(i))q.push(i);return q.slice(from,from+count)}
// [from, to) aralığındaki seçili gün sayısı (tam haftalar aritmetikle, kalan en çok 6 gün döngüyle)
export function selectedBetween(days:DayKey[],from:string,to:string):number{const n=daysBetween(from,to);const set=uniqDays(days);if(n<=0||!set.length)return 0;const weeks=Math.floor(n/7);let c=weeks*set.length;const base=addDays(from,weeks*7);for(let i=0;i<n%7;i++)if(set.includes(dayKeyOf(addDays(base,i))))c++;return c}
// Bir gün için kaynağın birimleri: geçmiş günlerde ve seçili olmayan günlerde null.
// Bugün: kota = bugüne kadar tamamlananlar + sıradaki birimler. Gelecek: bugünün kotası tamamlanacak varsayımıyla perDay × aradaki seçili gün kadar ilerlemiş sayılır.
export function unitsFor(r:Resource,date:string,today:string):{units:number[];done:boolean}|null{
 if(date<today||!r.days.includes(dayKeyOf(date)))return null;
 const todaySelected=r.days.includes(dayKeyOf(today));const n=selectedBetween(r.days,today,date);
 const units=chunk(r,today,n*r.perDay,r.perDay,todaySelected);if(!units.length)return null;
 return {units,done:units.every(i=>isUnitDone(r,i))}}
export function resourceTasksForDay(resources:Resource[],date:string,today:string):ResourceTask[]{const out:ResourceTask[]=[];
 for(const r of resources){const u=unitsFor(r,date,today);if(!u)continue;out.push({id:r.id,kind:r.kind,name:r.name,subject:r.subject,unit:r.unit,units:u.units,label:spanLabel(r,u.units),minutes:taskMinutes(r,u.units.length),done:u.done})}
 return out}
// Tahmini bitiş: kalan birim / perDay kadar seçili gün sonra (bugünün kotası tamamlandıysa yarından say). Seçili gün yoksa tarih yok.
export function finishEstimate(r:Resource,today:string):{finished:boolean;date:string|null;slots:number}{
 const left=r.total-doneCount(r);if(left<=0)return {finished:true,date:null,slots:0};const set=uniqDays(r.days);if(!set.length)return {finished:false,date:null,slots:0};
 const slots=Math.ceil(left/r.perDay);const todayUnits=unitsFor(r,today,today);const start=todayUnits&&todayUnits.done?addDays(today,1):today;
 const weeks=Math.floor((slots-1)/set.length);let need=slots-weeks*set.length;let d=addDays(start,weeks*7);
 for(let guard=0;guard<14;guard++){if(set.includes(dayKeyOf(d))){need--;if(need===0)return {finished:false,date:d,slots}}d=addDays(d,1)}
 return {finished:false,date:null,slots}}

// ---------- ilerleme işlemleri ----------
const doneList=(r:Resource):number[]=>r.kind==='playlist'?[...(r.watched||[])]:Array.from({length:r.done},(_,i)=>i+1);
// Tek giriş noktası: delta (±), set (tamamlanan sayısı = "şu an buradayım"), toggle (yalnız oynatma listesi). Sonuç her zaman 0..total.
export function applyProgress(r:Resource,op:ProgressOp,today:string):Resource{
 const before=doneList(r);let next:Resource;
 if(r.kind==='book'){
  if(op.mode==='toggle')throw new Error('toggle yalnız oynatma listesinde kullanılır');
  const done=op.mode==='delta'?clamp(r.done+Math.trunc(op.delta),0,r.total):clamp(Math.trunc(op.position),0,r.total);next={...r,done}}
 else{
  let w=new Set(r.watched||[]);
  if(op.mode==='set'){w=new Set(Array.from({length:clamp(Math.trunc(op.position),0,r.total)},(_,i)=>i+1))}
  else if(op.mode==='toggle'){const i=Math.trunc(op.index);if(i<1||i>r.total)throw new Error('video sırası geçersiz');if(w.has(i))w.delete(i);else w.add(i)}
  else{const k=Math.trunc(op.delta);if(k>0){for(const i of upcoming(r,k))w.add(i)}else if(k<0){const top=[...w].sort((a,b)=>b-a).slice(0,-k);for(const i of top)w.delete(i)}}
  const watched=[...w].filter(i=>i>=1&&i<=r.total).sort((a,b)=>a-b);next={...r,watched,done:watched.length}}
 if(op.mode==='set'){const {log:_l,...rest}=next;void _l;return rest}
 const after=new Set(doneList(next)),was=new Set(before);const base=new Set(todayLog(r,today));
 for(const i of after)if(!was.has(i))base.add(i);for(const i of was)if(!after.has(i))base.delete(i);
 const units=[...base].sort((a,b)=>a-b).slice(-LIMITS.log);const {log:_o,...rest}=next;void _o;return units.length?{...rest,log:{date:today,units}}:rest}
// "Bugünkünü bitirdim": bugünün kotasından tamamlanmamış her birimi tamamlar (bugün seçili gün değilse sıradaki perDay birim)
export function completeToday(r:Resource,today:string):Resource{const u=unitsFor(r,today,today);const units=u?u.units:upcoming(r);const pending=units.filter(i=>!isUnitDone(r,i));if(!pending.length)return r;
 if(r.kind==='book')return applyProgress(r,{mode:'delta',delta:Math.max(...pending)-r.done},today);
 let cur=r;for(const i of pending)cur=applyProgress(cur,{mode:'toggle',index:i},today);return cur}
// "Geri al": bugünün kotasındaki tamamlanmış birimleri geri açar (kitapta o kadar birim geri, listede o videoların işareti kalkar)
export function undoToday(r:Resource,today:string):Resource{const u=unitsFor(r,today,today);if(!u)return r;const doneUnits=u.units.filter(i=>isUnitDone(r,i));if(!doneUnits.length)return r;
 if(r.kind==='book')return applyProgress(r,{mode:'delta',delta:-doneUnits.length},today);
 let cur=r;for(const i of doneUnits)cur=applyProgress(cur,{mode:'toggle',index:i},today);return cur}

// ---------- oluşturma ve normalleştirme ----------
export function makeResource(input:ResourceInput,id:string):Resource{
 const book=input.kind==='book';const unit:ResourceUnit=book?(input.unit==='sayfa'?'sayfa':'test'):'video';const total=clamp(Math.trunc(input.total),1,LIMITS.total);const done=clamp(Math.trunc(input.done??0),0,total);
 const base:Resource={id,kind:input.kind,name:input.name.trim().slice(0,LIMITS.name),subject:(input.subject||'').trim().slice(0,LIMITS.subject),unit,total,done,perDay:clamp(Math.trunc(input.perDay),1,LIMITS.perDay),minPerUnit:clamp(Math.trunc(input.minPerUnit??DEFAULT_MIN[unit]),1,LIMITS.minPerUnit),days:uniqDays(input.days?.length?input.days:[...ALL_DAYS])};
 if(book)return base;
 return {...base,listId:input.listId,items:(input.items||[]).slice(0,LIMITS.items).map(x=>({id:x.id,title:x.title.slice(0,LIMITS.title)})),watched:Array.from({length:done},(_,i)=>i+1)}}
// Eski/bozuk kayıtları güvenle okur: geçersiz kaynak atlanır, sayılar sınırlanır, tutarsız ilerleme düzeltilir.
export function normalizeResources(raw:unknown):Resource[]{if(!Array.isArray(raw))return [];const out:Resource[]=[];const ids=new Set<string>();
 for(const [i,x] of raw.entries()){if(out.length>=LIMITS.resources)break;if(!x||typeof x!=='object')continue;const r=x as Record<string,any>;
  const kind:ResourceKind|null=r.kind==='book'||r.kind==='playlist'?r.kind:null;const name=typeof r.name==='string'?r.name.trim().slice(0,LIMITS.name):'';if(!kind||!name)continue;
  const total=int(r.total,0,LIMITS.total,0);if(total<1)continue;
  let id=typeof r.id==='string'&&r.id?r.id.slice(0,60):`kaynak-${i}`;if(ids.has(id))id=`${id}-${i}`;ids.add(id);
  const unit:ResourceUnit=kind==='playlist'?'video':r.unit==='sayfa'?'sayfa':'test';
  const days=Array.isArray(r.days)?uniqDays(r.days):[];
  const base:Resource={id,kind,name,subject:typeof r.subject==='string'?r.subject.trim().slice(0,LIMITS.subject):'',unit,total,done:0,perDay:int(r.perDay,1,LIMITS.perDay,1),minPerUnit:int(r.minPerUnit,1,LIMITS.minPerUnit,DEFAULT_MIN[unit]),days:days.length?days:[...ALL_DAYS]};
  const lg=r.log&&typeof r.log==='object'&&typeof r.log.date==='string'&&DATE.test(r.log.date)&&Array.isArray(r.log.units)?{date:r.log.date as string,units:unitList(r.log.units,total).slice(-LIMITS.log)}:null;
  const log=lg&&lg.units.length?{log:lg}:{};
  if(kind==='book'){out.push({...base,done:int(r.done,0,total,0),...log});continue}
  if(typeof r.listId!=='string'||!LIST_ID.test(r.listId))continue;
  const items=(Array.isArray(r.items)?r.items:[]).filter((v:any)=>v&&typeof v.id==='string'&&VIDEO_ID.test(v.id)).slice(0,LIMITS.items).map((v:any)=>({id:v.id as string,title:String(v.title??'').slice(0,LIMITS.title)}));
  const watched=unitList(r.watched,total);
  out.push({...base,listId:r.listId,items,watched,done:watched.length,...log})}
 return out}
