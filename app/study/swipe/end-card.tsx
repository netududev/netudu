"use client";
// Kaydır Çöz bitiş kartı: oturum özeti, çalışılacaklar ve sonraki adımlar (tek birincil: Bugüne dön)
import type {Question} from '@/lib/study';
import type {Summary} from '@/lib/swipe/queue';
import type {SwipeSession} from '@/lib/swipe/session';
import {X} from '@/components/icons';

const longDay=(d:string)=>new Date(d+'T12:00:00').toLocaleDateString('tr-TR',{day:'numeric',month:'long'});

export function EndCard({pos,size,sm,rows,session,headRef,onClose,onHome,early,learned,onEarly,onLearned,onRetry}:{pos:number;size:number;sm:Summary;rows:Map<string,Question>;session:SwipeSession;headRef:(el:HTMLElement|null)=>void;onClose:()=>void;onHome:()=>void;early:number;learned:number;onEarly:()=>void;onLearned:()=>void;onRetry:()=>void}){
  const hard=session.struggle.map(id=>rows.get(id)).filter((q):q is Question=>!!q);
  return <article className="sw-card sw-end" data-idx={pos-1} aria-labelledby="sw-end-h" aria-posinset={pos} aria-setsize={size}>
    <header className="sw-strip"><button type="button" className="sw-close icon-button" aria-label="Kaydır Çöz'ü kapat" onClick={onClose}><X size={20}/></button><span className="sw-line" aria-hidden="true"><i style={{width:'100%'}}/></span></header>
    <div className="scroll-body">
      <h2 id="sw-end-h" tabIndex={-1} ref={headRef} className="sw-end-title">{sm.total} soruyu geçtin</h2>
      <dl className="sw-stats"><div><dt>Bildim</dt><dd>{sm.bildim}</dd></div><div><dt>Bilemedim</dt><dd>{sm.bilemedim}</dd></div><div><dt>Atladın</dt><dd>{sm.atlandi}</dd></div></dl>
      {sm.nextReview&&<p className="sw-next">Sıradaki tekrar: {longDay(sm.nextReview.date)}, {sm.nextReview.count} soru</p>}
      {hard.length>0&&<div className="sw-hard"><strong>Çalışman gerekenler</strong><ul>{hard.map(q=><li key={q.id}>{q.subject} · {q.topic}</li>)}</ul></div>}
    </div>
    <footer className="sw-bar sw-end-actions">
      <button type="button" className="primary" onClick={onHome}>Bugüne dön</button>
      {sm.bilemedim>0&&<button type="button" className="secondary" onClick={onRetry}>Bilemediklerini yeniden geç</button>}
      {early>0&&<button type="button" className="secondary" onClick={onEarly}>Erken tekrara devam et</button>}
      {learned>0&&<button type="button" className="secondary" onClick={onLearned}>Öğrenilenler dahil baştan</button>}
    </footer>
  </article>;
}
