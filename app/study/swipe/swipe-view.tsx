"use client";
// Kaydır Çöz görünümü: başlangıç ekranı (ders, kapsam, başla / devam) ve akış. Kurallar lib/swipe/*, oturum use-swipe-session.ts içindedir.
import {useState} from 'react';
import {Plus} from '@/components/icons';
import {today,subjects,isUnrecognized,PENDING_FILTER} from '@/lib/study';
import {buildPool} from '@/lib/swipe/queue';
import {useStudy,Empty,SkelRows} from '../shared';
import {useSwipeSession} from './use-swipe-session';
import {Feed} from './feed';

const ALL='Tüm dersler';

export function SwipeView(){
  const s=useStudy();const w=useSwipeSession();
  const [subject,setSubject]=useState(ALL),[scopeChoice,setScope]=useState<'due'|'all'|null>(null);
  if(w.session)return <Feed w={w} onHome={()=>{w.exit();s.setView('home')}}/>;
  const day=today();const rows=s.rows;const pending=rows.filter(isUnrecognized).length;
  if(s.loading&&!rows.length)return <div className="sw-start"><SkelRows rows={3}/></div>;
  if(rows.length===pending)return <div className="sw-start"><Empty title="Kaydırmak için önce yanlış ekle" action={<button type="button" className="primary" onClick={()=>s.openUpload()}><Plus size={17}/> Yanlış ekle</button>}>Yanlışlarını ekledikçe burada tek tek kaydırıp çözebilirsin.</Empty>{pending>0&&<PendingLine n={pending} onGo={()=>s.setSubjectFilter(PENDING_FILTER)}/>}</div>;
  const due=buildPool(rows,day,{subject:ALL,scope:'due',includeLearned:false}).length;
  const scope=scopeChoice??(due>0?'due':'all');
  const count=(sub:string)=>buildPool(rows,day,{subject:sub,scope,includeLearned:false}).length;
  const chips=subjects.map(n=>({n,c:count(n)})).filter(x=>x.c>0);const sel=chips.some(x=>x.n===subject)?subject:ALL;const total=count(sel);
  const saved=w.saved;const hist=saved?saved.history.length:0;const left=saved?saved.queue.length:0;const resumable=!!saved&&hist>0&&left+(saved.current?1:0)>0;
  const begin=()=>{w.start({subject:sel,scope,includeLearned:false})};
  return <div className="sw-start">
    <h2 className="sw-hello">{due>0?`Bugün ${due} soru seni bekliyor`:'Bugünkü tekrarların bitti. İstersen erken tekrar yap.'}</h2>
    <div className="sw-chips" role="group" aria-label="Ders">{[{n:ALL,c:count(ALL),label:'Tümü'},...chips.map(x=>({...x,label:x.n}))].map(x=><button type="button" key={x.n} className={'sw-subject'+(sel===x.n?' on':'')} aria-pressed={sel===x.n} onClick={()=>setSubject(x.n)}>{x.label}<span>{x.c}</span></button>)}</div>
    <div className="segmented sw-scope" role="group" aria-label="Kapsam"><button type="button" className={scope==='due'?'on':''} aria-pressed={scope==='due'} onClick={()=>setScope('due')}>Yalnız bugünkü</button><button type="button" className={scope==='all'?'on':''} aria-pressed={scope==='all'} onClick={()=>setScope('all')}>Tümü</button></div>
    {total===0&&<p className="sw-none" role="status">Bu seçimde kaydırılacak soru yok.</p>}
    <div className="sw-actions">
      {resumable?<><button type="button" className="primary" onClick={w.resume}>Kaldığın yerden devam et ({hist}/{hist+left})</button><button type="button" className="secondary" disabled={total===0} onClick={begin}>Baştan başla</button></>
        :<button type="button" className="primary" disabled={total===0} onClick={begin}>Başla</button>}
    </div>
    {pending>0&&<PendingLine n={pending} onGo={()=>s.setSubjectFilter(PENDING_FILTER)}/>}
  </div>;
}
const PendingLine=({n,onGo}:{n:number;onGo:()=>void})=><p className="sw-pending">{n} soru konu bekliyor, <button type="button" className="text-button" onClick={onGo}>deftere git</button></p>;
