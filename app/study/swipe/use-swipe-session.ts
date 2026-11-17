"use client";
// Kaydır Çöz oturum kancası: durum, localStorage, arka plan yazmaları. Kurallar lib/swipe/* içindedir; burada yalnız bağlama kodu vardır.
import {useCallback,useEffect,useRef,useState} from 'react';
import {toast} from 'sonner';
import {today,scheduleReview,reviewIntervals,type Question} from '@/lib/study';
import {startSession,advance,leaveCard,markCurrent,reclassify,buildPool,shouldWrite,type PoolOptions} from '@/lib/swipe/queue';
import {loadSession,saveSession,collectPending,purgeOldSessions,settleOldSessions,newSession,addPending,afterAttempt,duePending,failedCount,type SwipeSession,type Outcome,type Review,type Tier} from '@/lib/swipe/session';
import {useStudy,postJson,authHeaders,ApiError} from '../shared';

const store=()=>{try{return typeof window==='undefined'?null:window.localStorage}catch{return null}};
const longDay=(d:string)=>new Date(d+'T12:00:00').toLocaleDateString('tr-TR',{day:'numeric',month:'long'});
// İşaretlenen sonucun takvime etkisi (yazma kuralı: lib/swipe/queue.ts shouldWrite; yalnız oturumdaki ilk sonuç yazılır)
export function resultNote(q:Question,tier:Tier,outcome:Outcome,repeat:boolean):string{
  if(repeat)return 'Bu oturumdaki ilk sonucun geçerli.';
  const rev=shouldWrite(tier,outcome);if(!rev)return 'Takvim değişmedi.';
  if(rev==='yanlış')return 'Yarın yeniden karşına gelecek.';
  const next=scheduleReview(q.review_stage,'doğru').nextReview;return next?`Bir sonraki tekrar ${longDay(next)}.`:'Bu soru öğrenildi olarak işaretlenecek.';
}
export const outcomeLabel=(o:Outcome|null)=>o==='bildim'?'Bildim':o==='bilemedim'?'Bilemedim':'Atlandı';
export type SwipeApi=ReturnType<typeof useSwipeSession>;

export function useSwipeSession(){
  const s=useStudy();const sRef=useRef(s);sRef.current=s;
  const uid=s.user?.id||s.user?.email||'anon';const uidRef=useRef(uid);uidRef.current=uid;
  const [sess,setSess]=useState<SwipeSession|null>(null),[saved,setSaved]=useState<SwipeSession|null>(null),[picks,setPicks]=useState<Record<number,string>>({}),[learned,setLearned]=useState<Set<string>>(new Set()),[live,setLive]=useState(''),[online,setOnline]=useState(true),[epoch,setEpoch]=useState(0);
  const sessRef=useRef<SwipeSession|null>(null);const activeRef=useRef(false);const picksRef=useRef<Record<number,string>>({});const inflight=useRef(new Set<string>());const hideSent=useRef(new Set<string>());const learnedRef=useRef(new Set<string>());const loaded=useRef(false);
  const map=()=>new Map(sRef.current.rows.map(q=>[q.id,q]));
  // Oturum bellekte (sessRef) çıkıştan sonra da güncel kalır; ekranda yalnız etkinken (activeRef) görünür
  const commit=useCallback((n:SwipeSession)=>{sessRef.current=n;if(activeRef.current)setSess(n);saveSession(store(),uidRef.current,n)},[]);
  const resetPicks=()=>{picksRef.current={};setPicks({})};

  // Bekleyen yazmalar arka planda gider; akış yanıtı beklemez. Başarısızlık pending'de kalır (en çok 3 deneme)
  const flush=useCallback(()=>{
    const c=sessRef.current;if(!c)return;
    for(const p of duePending(c.pending)){
      if(inflight.current.has(p.id))continue;inflight.current.add(p.id);
      void(async()=>{let ok=false;
        try{const d=await postJson(`/api/questions/${p.id}`,{review:p.review},'PATCH');sRef.current.upsert(d.question);ok=true}catch(e){ok=e instanceof ApiError&&e.status===404}
        inflight.current.delete(p.id);const cur=sessRef.current;if(cur)commit({...cur,pending:afterAttempt(cur.pending,p.id,ok)})})();
    }
  },[commit]);

  // Sekme gizlenirken / sayfa kapanırken: bekleyenler + işaretli ama henüz terk edilmemiş kartın sonucu keepalive ile gider.
  // Çevrimdışıyken hiçbir şey gönderilmez ya da silinmez. Kayıt yalnız keepalive yanıtı başarılıysa pending'den çıkar; başarısızsa kalır
  // (sayfa yanıttan önce kapanırsa kayıt localStorage'da kalır). Güncel kartın gizleme yazması hideSent ile oturum başına tek kez gider.
  const hideFlush=useCallback(()=>{
    if(typeof navigator!=='undefined'&&navigator.onLine===false)return;
    const c=sessRef.current;if(!c)return;
    const list:{id:string;review:Review;cur:boolean}[]=duePending(c.pending).filter(p=>!inflight.current.has(p.id)).map(p=>({id:p.id,review:p.review,cur:false}));
    if(c.current&&c.mark&&!c.results[c.current]?.first&&!hideSent.current.has(c.current)&&!inflight.current.has(c.current)&&!list.some(p=>p.id===c.current)){const rev=shouldWrite(c.tiers[c.current]??'B',c.mark);if(rev){list.push({id:c.current,review:rev,cur:true});hideSent.current.add(c.current)}}
    for(const p of list){
      inflight.current.add(p.id);
      void(async()=>{let ok=false;
        try{const r=await fetch(`/api/questions/${p.id}`,{method:'PATCH',keepalive:true,credentials:'include',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify({review:p.review})});ok=r.ok||r.status===404;if(r.ok){try{sRef.current.upsert((await r.json()).question)}catch{}}}catch{}
        inflight.current.delete(p.id);const cur=sessRef.current;if(!cur)return;
        if(!p.cur)commit({...cur,pending:afterAttempt(cur.pending,p.id,ok)});
        else if(!ok){if(cur.current===p.id)hideSent.current.delete(p.id);else commit({...cur,pending:addPending(cur.pending,p.id,p.review)})}// kart terk edilmişse sonuç şimdi bekleyene girer
      })();
    }
  },[commit]);

  // Açılış: kayıtlı oturum + eski günlerin bekleyenleri (tries>=3 dahil). Her deneme sonucu anında anahtara işlenir: gidenler çıkar, başarısızlar kalır ve tries artar
  useEffect(()=>{
    if(s.loading||loaded.current)return;loaded.current=true;const st=store(),day=today();
    setSaved(loadSession(st,uid,day,s.rows.map(q=>q.id)));
    const old=collectPending(st,uid,day);purgeOldSessions(st,uid,day,true);if(!old.length)return;
    void(async()=>{for(const o of old)for(const p of o.pending){let ok=false;try{const d=await postJson(`/api/questions/${p.id}`,{review:p.review},'PATCH');sRef.current.upsert(d.question);ok=true}catch(e){ok=e instanceof ApiError&&e.status===404}settleOldSessions(st,uid,day,o.day,p.id,ok)}})();
  },[s.loading,s.rows,uid]);
  useEffect(()=>{
    setOnline(typeof navigator==='undefined'||navigator.onLine!==false);
    const on=()=>{setOnline(true);const c=sessRef.current;if(c){commit({...c,pending:c.pending.map(p=>({...p,tries:0}))});flush()}},off=()=>setOnline(false);
    const vis=()=>{if(document.visibilityState==='hidden')hideFlush()};
    window.addEventListener('online',on);window.addEventListener('offline',off);document.addEventListener('visibilitychange',vis);window.addEventListener('pagehide',hideFlush);
    return()=>{window.removeEventListener('online',on);window.removeEventListener('offline',off);document.removeEventListener('visibilitychange',vis);window.removeEventListener('pagehide',hideFlush)};
  },[commit,flush,hideFlush]);
  const failed=sess?failedCount(sess.pending):0;// yalnız ekrandaki oturum
  useEffect(()=>{if(failed>0)toast.warning(`${failed} sonuç kaydedilemedi. Bağlantı gelince yeniden denenecek.`,{id:'kaydir-bekleyen'})},[failed]);

  // Güncel kartı terk eder (sonuç işlenir); silinmiş ya da "öğrendim" denen kart sonuç üretmez
  const leave=(c:SwipeSession):SwipeSession=>{
    if(!c.current)return c;const q=map().get(c.current);let n:SwipeSession={...c,mark:null};
    if(q&&!learnedRef.current.has(q.id))n=leaveCard(c,q).session;
    return {...n,pending:n.pending.filter(p=>!hideSent.current.has(p.id))};
  };
  const next=useCallback(()=>{const c=sessRef.current;if(!c||!c.current)return;commit(advance(leave(c),map()));flush()},[commit,flush]);// eslint-disable-line react-hooks/exhaustive-deps
  // Her açılış (başla / devam / bitiş kartı eylemleri) yeni bir epoch: Feed anahtarı değişir, akış baştan kurulur; hideSent oturumla sıfırlanır
  const open=(n:SwipeSession)=>{activeRef.current=true;hideSent.current.clear();resetPicks();setSaved(null);setEpoch(e=>e+1);commit(n)};
  const begin=(n:SwipeSession)=>open(advance({...n,pending:sessRef.current?.pending??saved?.pending??[]},map()));
  const start=useCallback((o:PoolOptions)=>{const r=startSession(sRef.current.rows,today(),o);if(!r.queue.length)return false;begin(r);return true},[saved]);// eslint-disable-line react-hooks/exhaustive-deps
  const resume=useCallback(()=>{const base=sessRef.current??saved;if(!base)return;let n=reclassify(base,map(),today());if(!n.current)n=advance(n,map());open(n)},[saved]);// eslint-disable-line react-hooks/exhaustive-deps
  const exit=useCallback(()=>{
    const c=sessRef.current;if(!c)return;const n={...leave(c),current:null};
    commit(n);flush();activeRef.current=false;setSess(null);resetPicks();setSaved(n.queue.length?n:null);
  },[commit,flush]);// eslint-disable-line react-hooks/exhaustive-deps
  const mark=useCallback((o:Outcome)=>{
    const c=sessRef.current;if(!c||!c.current)return;const q=map().get(c.current);if(!q)return;
    commit(markCurrent(c,o));setLive(`${outcomeLabel(o)}. ${resultNote(q,c.tiers[q.id]??'B',o,!!c.results[q.id]?.first)}`);
  },[commit]);// eslint-disable-line react-hooks/exhaustive-deps
  // Şık dokunuşu: seçimi kilitler ve doğru → Bildim, yanlış → Bilemedim işaretler
  const pick=useCallback((i:number,letter:string,key:string)=>{if(picksRef.current[i])return;picksRef.current={...picksRef.current,[i]:letter};setPicks(picksRef.current);mark(letter===key?'bildim':'bilemedim')},[mark]);
  const markLearned=useCallback(async(q:Question)=>{
    try{const d=await postJson(`/api/questions/${q.id}`,{markLearned:true},'PATCH');sRef.current.upsert(d.question);
      learnedRef.current.add(q.id);setLearned(new Set(learnedRef.current));
      const c=sessRef.current;if(c)commit({...c,mark:null,queue:c.queue.filter(id=>id!==q.id),pending:c.pending.filter(p=>p.id!==q.id)});
      toast.success('Soru öğrenildi olarak işaretlendi.')}catch(e){toast.error((e as Error).message)}
  },[commit]);
  // Bitiş kartı eylemleri: yeni oturum kurulur, bekleyen yazmalar taşınır
  const earlyPool=(c:SwipeSession)=>buildPool(sRef.current.rows,today(),{subject:c.subject,scope:'all',includeLearned:false}).filter(q=>!c.results[q.id]);
  const learnedPool=(c:SwipeSession)=>buildPool(sRef.current.rows,today(),{subject:c.subject,scope:'all',includeLearned:true}).filter(q=>q.review_stage>=reviewIntervals.length&&!c.results[q.id]);
  const fresh=(queue:Question[],subject:string,includeLearned:boolean)=>{const tiers:Record<string,Tier>={};for(const q of queue)tiers[q.id]='B';return newSession({day:today(),subject,scope:'all',includeLearned,queue:queue.map(q=>q.id),tiers})};
  const continueEarly=useCallback(()=>{const c=sessRef.current;if(!c)return;const pool=earlyPool(c);if(pool.length)begin(fresh(pool,c.subject,false))},[]);// eslint-disable-line react-hooks/exhaustive-deps
  const restartWithLearned=useCallback(()=>{const c=sessRef.current;if(!c)return;const r=startSession(sRef.current.rows,today(),{subject:c.subject,scope:'all',includeLearned:true});if(r.queue.length)begin(r)},[]);// eslint-disable-line react-hooks/exhaustive-deps
  const retryStruggled=useCallback(()=>{const c=sessRef.current;if(!c)return;const ids=new Set(Object.entries(c.results).filter(([,r])=>r.first==='bilemedim').map(([id])=>id));
    const pool=buildPool(sRef.current.rows.filter(q=>ids.has(q.id)),today(),{subject:'Tüm dersler',scope:'all',includeLearned:true});if(pool.length)begin(fresh(pool,'Tüm dersler',true))},[]);// eslint-disable-line react-hooks/exhaustive-deps
  return {session:sess,epoch,saved,rows:map(),picks,learned,live,setLive,online,failed,start,resume,exit,next,mark,pick,markLearned,continueEarly,restartWithLearned,retryStruggled,earlyCount:(c:SwipeSession)=>earlyPool(c).length,learnedCount:(c:SwipeSession)=>learnedPool(c).length};
}
