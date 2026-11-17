// Kaydır Çöz sıralama ve tekrar kuralları. Saf: React ve ağ yok; tarih dışarıdan verilir; rastgelelik yok.
import {reviewIntervals,matchesSubject,isUnrecognized,topicHistory,type Question} from '../study';
import {newSession,addPending,type Outcome,type Review,type SwipeSession} from './session';

export type Tier='A'|'B'|'C';
export type PoolOptions={subject:string;scope:'due'|'all';includeLearned:boolean};
export const REINSERT_OFFSETS=[4,8];// Bilemedim: 1. kez 4, 2. kez 8 kart sonra; 3.'de düşer
export const MIX_WINDOW=5;

const learned=(q:Question)=>q.review_stage>=reviewIntervals.length;
export const tierOf=(q:Question,today:string):Tier=>learned(q)?'C':(!q.next_review||q.next_review<=today)?'A':'B';
const lastReview=(q:Question)=>q.review_log?.length?q.review_log[q.review_log.length-1].date:'';
const byId=(a:Question,b:Question)=>a.id.localeCompare(b.id);

// Havuz: ders filtresi + tanınmayan dışarıda + katman sırası (A, sonra kapsam 'all' ise B, sonra includeLearned ise C)
export function buildPool(rows:Question[],today:string,o:PoolOptions):Question[]{
  const ok=rows.filter(q=>matchesSubject(q,o.subject)&&!isUnrecognized(q));
  const tier=(k:Tier)=>ok.filter(q=>tierOf(q,today)===k);
  const A=tier('A').sort((a,b)=>(a.next_review||'').localeCompare(b.next_review||'')||a.review_stage-b.review_stage||byId(a,b));
  const B=o.scope==='all'?tier('B').sort((a,b)=>(a.next_review||'').localeCompare(b.next_review||'')||topicHistory(rows,b.subject,b.topic,b.id).length-topicHistory(rows,a.subject,a.topic,a.id).length||byId(a,b)):[];
  const C=o.includeLearned?tier('C').sort((a,b)=>lastReview(a).localeCompare(lastReview(b))||byId(a,b)):[];
  return [...A,...B,...C];
}
export const startSession=(rows:Question[],today:string,o:PoolOptions)=>newSession({day:today,subject:o.subject,scope:o.scope,includeLearned:o.includeLearned,queue:buildPool(rows,today,o).map(q=>q.id)});

export const topicKey=(q:Pick<Question,'subject'|'topic'>)=>q.subject+'|'+q.topic;
// Karıştırma: baş katmanın ilk 5 sorusundan, son iki karttaki konulardan farklı ilk soru; yoksa ilk soru
export function pickNext(queue:Question[],recentTopics:string[],today:string):Question|null{
  if(!queue.length)return null;const head=tierOf(queue[0],today);
  const window=queue.filter(q=>tierOf(q,today)===head).slice(0,MIX_WINDOW);
  return window.find(q=>!recentTopics.includes(topicKey(q)))??window[0];
}
// Sıradaki kartı seçer: kuyruktan çıkarır, geçmişe yazar; silinmiş (rows'ta olmayan) kimlikler sessizce düşer
export function advance(s:SwipeSession,rows:Map<string,Question>,today:string):SwipeSession{
  const queue=s.queue.filter(id=>rows.has(id));
  const recent=s.history.slice(-2).map(id=>rows.get(id)).filter((q):q is Question=>!!q).map(topicKey);
  const next=pickNext(queue.map(id=>rows.get(id)!),recent,today);
  if(!next)return {...s,queue:[],current:null,mark:null};
  return {...s,queue:queue.filter(id=>id!==next.id),current:next.id,history:[...s.history,next.id],mark:null};
}
// Katmana göre sunucu yazma kuralı: A iki sonucu da; B/C yalnız Bilemedim (erken Bildim takvimi yapay uzatmasın)
export function shouldWrite(tier:Tier,outcome:Outcome):Review|null{
  if(outcome==='bilemedim')return 'yanlış';
  return outcome==='bildim'&&tier==='A'?'doğru':null;
}
// Bir kartın terk edilme anı: sonucu işler, yeniden çıkmayı ve (yalnız ilk sonuç için) bekleyen yazmayı üretir
export function applyResult(s:SwipeSession,q:Question,outcome:Outcome,today:string):{session:SwipeSession;write:{id:string;review:Review;tries:number}|null}{
  const prev=s.results[q.id]??{first:null,wrong:0,skips:0};let r={...prev};let queue=[...s.queue];let struggle=s.struggle;let pending=s.pending;let write=null;
  if(outcome!=='atlandi'&&r.first===null){r.first=outcome;const review=shouldWrite(tierOf(q,today),outcome);if(review){pending=addPending(pending,q.id,review);write=pending.find(p=>p.id===q.id)!}}
  if(outcome==='bilemedim'){r.wrong++;const off=REINSERT_OFFSETS[r.wrong-1];if(off===undefined)struggle=struggle.includes(q.id)?struggle:[...struggle,q.id];else queue.splice(Math.min(off,queue.length),0,q.id)}
  if(outcome==='atlandi'){r.skips++;if(r.skips===1)queue.push(q.id)}
  return {session:{...s,queue,struggle,pending,mark:null,results:{...s.results,[q.id]:r}},write};
}
// "Sonucu değiştir": yalnız yerel işaret; istek kart terk edilince (leaveCard) tek kez doğar
export const markCurrent=(s:SwipeSession,outcome:Outcome):SwipeSession=>({...s,mark:outcome});
export const leaveCard=(s:SwipeSession,q:Question,today:string)=>applyResult(s,q,s.mark??'atlandi',today);

export type Summary={total:number;bildim:number;bilemedim:number;atlandi:number;struggle:string[];nextReview:{date:string;count:number}|null};
// Bitiş özeti: sayılar soru başına ilk sonuca göre; sıradaki tekrar = oturumdaki soruların bugünden sonraki en erken next_review'ı
export function summary(s:SwipeSession,rows:Question[],today:string):Summary{
  const res=Object.entries(s.results);const seen=new Set(res.map(([id])=>id));
  const dates=rows.filter(q=>seen.has(q.id)&&q.next_review&&q.next_review>today).map(q=>q.next_review as string).sort();
  return {total:res.length,bildim:res.filter(([,r])=>r.first==='bildim').length,bilemedim:res.filter(([,r])=>r.first==='bilemedim').length,atlandi:res.filter(([,r])=>r.first===null&&r.skips>0).length,struggle:s.struggle,nextReview:dates.length?{date:dates[0],count:dates.filter(d=>d===dates[0]).length}:null};
}
