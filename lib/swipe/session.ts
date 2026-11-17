// Kaydır Çöz oturum durumu: tip, localStorage (serialize/restore) ve bekleyen yazma listesi. Saf; React ve ağ yok.
export type Outcome='bildim'|'bilemedim'|'atlandi';
export type Review='doğru'|'yanlış';
export type Tier='A'|'B'|'C';
export type Pending={id:string;review:Review;tries:number};
// first: oturumdaki İLK gerçek sonuç (atlama sonuç sayılmaz); wrong/skips: yeniden çıkma sayaçları
export type CardResult={first:Exclude<Outcome,'atlandi'>|null;wrong:number;skips:number};
export type SwipeSession={day:string;subject:string;scope:'due'|'all';includeLearned:boolean;queue:string[];current:string|null;history:string[];mark:Outcome|null;results:Record<string,CardResult>;struggle:string[];pending:Pending[];tiers:Record<string,Tier>};
// tiers: oturum BAŞINDA dondurulan katman (kimlik → A/B/C); sunucu yazması vadeyi kaydırsa da değişmez
export const MAX_TRIES=3;
type Storage={getItem(k:string):string|null;setItem(k:string,v:string):void;removeItem(k:string):void;key(i:number):string|null;length:number};

export const newSession=(o:{day:string;subject:string;scope:'due'|'all';includeLearned:boolean;queue:string[];tiers?:Record<string,Tier>}):SwipeSession=>({...o,tiers:o.tiers??{},current:null,history:[],mark:null,results:{},struggle:[],pending:[]});
export const sessionKey=(user:string,day:string)=>`kaydir:${user}:${day}`;
export const serialize=(s:SwipeSession)=>JSON.stringify(s);

const isStrs=(v:unknown):v is string[]=>Array.isArray(v)&&v.every(x=>typeof x==='string');
const isTier=(v:unknown)=>v==='A'||v==='B'||v==='C';
const isOutcome=(v:unknown)=>v==='bildim'||v==='bilemedim'||v==='atlandi';
// Bozuk JSON, eski gün ya da yanlış şekil → null; silinmiş soru kimlikleri her listeden ayıklanır
export function restore(raw:string|null|undefined,ctx:{day:string;ids:Iterable<string>}):SwipeSession|null{
  if(!raw)return null;let p:any;try{p=JSON.parse(raw)}catch{return null}
  if(!p||typeof p!=='object'||p.day!==ctx.day||typeof p.subject!=='string'||(p.scope!=='due'&&p.scope!=='all')||typeof p.includeLearned!=='boolean')return null;
  if(!isStrs(p.queue)||!isStrs(p.history)||!isStrs(p.struggle)||!(p.current===null||typeof p.current==='string')||!(p.mark===null||isOutcome(p.mark)))return null;
  if(!p.results||typeof p.results!=='object'||!Array.isArray(p.pending))return null;
  const live=new Set(ctx.ids);const keep=(l:string[])=>l.filter(id=>live.has(id));
  const results:Record<string,CardResult>={};for(const [id,r] of Object.entries<any>(p.results)){if(!live.has(id))continue;if(!r||typeof r.wrong!=='number'||typeof r.skips!=='number'||!(r.first===null||r.first==='bildim'||r.first==='bilemedim'))return null;results[id]={first:r.first,wrong:r.wrong,skips:r.skips}}
  const pending:Pending[]=[];for(const x of p.pending){if(!x||typeof x.id!=='string'||(x.review!=='doğru'&&x.review!=='yanlış')||typeof x.tries!=='number')return null;if(live.has(x.id))pending.push({id:x.id,review:x.review,tries:x.tries})}
  const tiers:Record<string,Tier>={};if(p.tiers&&typeof p.tiers==='object')for(const [id,v] of Object.entries<any>(p.tiers))if(live.has(id)&&isTier(v))tiers[id]=v;
  const current=p.current&&live.has(p.current)?p.current:null;
  return {day:p.day,subject:p.subject,scope:p.scope,includeLearned:p.includeLearned,queue:keep(p.queue),current,history:keep(p.history),mark:current?p.mark:null,results,struggle:keep(p.struggle),pending,tiers};
}
// Depolama yoksa ya da hata verirse oturum yalnız bellekte yaşar: hiçbiri fırlatmaz
export function loadSession(st:Storage|null|undefined,user:string,day:string,ids:Iterable<string>):SwipeSession|null{try{return st?restore(st.getItem(sessionKey(user,day)),{day,ids}):null}catch{return null}}
export function saveSession(st:Storage|null|undefined,user:string,s:SwipeSession):boolean{try{if(!st)return false;st.setItem(sessionKey(user,s.day),serialize(s));return true}catch{return false}}
// Eski günlerin gönderilmemiş (tries<MAX_TRIES) bekleyen yazmaları; K2 anahtarları silmeden ÖNCE bunları göndermelidir
export function collectPending(st:Storage|null|undefined,user:string,day:string):{day:string;pending:Pending[]}[]{
  const out:{day:string;pending:Pending[]}[]=[];
  try{if(!st)return out;const prefix=`kaydir:${user}:`,keep=sessionKey(user,day);
    for(let i=0;i<st.length;i++){const k=st.key(i);if(!k||!k.startsWith(prefix)||k===keep)continue;
      try{const p=JSON.parse(st.getItem(k)??'null');if(!p||!Array.isArray(p.pending))continue;
        const pending:Pending[]=duePending(p.pending.filter((x:any)=>x&&typeof x.id==='string'&&(x.review==='doğru'||x.review==='yanlış')&&typeof x.tries==='number').map((x:any)=>({id:x.id,review:x.review,tries:x.tries})));
        if(pending.length)out.push({day:k.slice(prefix.length),pending})}catch{}}}catch{}
  return out;
}
export function purgeOldSessions(st:Storage|null|undefined,user:string,day:string){try{if(!st)return;const prefix=`kaydir:${user}:`,keep=sessionKey(user,day);const old:string[]=[];for(let i=0;i<st.length;i++){const k=st.key(i);if(k&&k.startsWith(prefix)&&k!==keep)old.push(k)}for(const k of old)st.removeItem(k)}catch{}}

// Bekleyen yazma listesi: soru başına tek kayıt (ilk sonuç); en fazla MAX_TRIES deneme
export const addPending=(p:Pending[],id:string,review:Review):Pending[]=>p.some(x=>x.id===id)?p:[...p,{id,review,tries:0}];
export const duePending=(p:Pending[])=>p.filter(x=>x.tries<MAX_TRIES);
export const afterAttempt=(p:Pending[],id:string,ok:boolean):Pending[]=>ok?p.filter(x=>x.id!==id):p.map(x=>x.id===id?{...x,tries:x.tries+1}:x);
export const failedCount=(p:Pending[])=>p.filter(x=>x.tries>=MAX_TRIES).length;
