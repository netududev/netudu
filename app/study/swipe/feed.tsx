"use client";
// Kaydırma kabı: tarayıcının kendi scroll-snap kaydırması; etkin kartı IntersectionObserver (eşik 0,6) bulur.
// Kartlar: her soru için [soru, çözüm]; sondaki "sıradaki" boşluğu etkinleşince güncel kart terk edilir ve sıradaki soru (ya da bitiş kartı) oraya gelir.
import React,{useCallback,useEffect,useRef,useState} from 'react';
import {summary} from '@/lib/swipe/queue';
import {today} from '@/lib/study';
import {optionLetter} from '@/lib/swipe/answer';
import {resultNote,type SwipeApi} from './use-swipe-session';
import {QuestionCard,type CardMeta} from './question-card';
import {SolutionCard} from './solution-card';
import {EndCard} from './end-card';

const BEFORE=2,AFTER=3,HINT_CARDS=3,AUTO_MS=400;
const isField=(t:EventTarget|null)=>{const e=t as HTMLElement|null;return !!e&&(['INPUT','TEXTAREA','SELECT'].includes(e.tagName)||e.isContentEditable)};
const reducedMotion=()=>typeof matchMedia!=='undefined'&&matchMedia('(prefers-reduced-motion: reduce)').matches;

export function Feed({w,onHome}:{w:SwipeApi;onHome:()=>void}){
  const ss=w.session!;const H=ss.history.length;const slots=2*H+1;const tail=2*H;const total=H+ss.queue.length;
  const feedRef=useRef<HTMLDivElement>(null);const heads=useRef(new Map<number,HTMLElement>());const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const [active,setActive]=useState(()=>Math.max(0,2*(H-1)));const [msg,setMsg]=useState('');const activeRef=useRef(active);activeRef.current=active;
  const curQ=2*(H-1);const hasCurrent=ss.current!==null;

  const goTo=useCallback((i:number,instant=false)=>{const el=feedRef.current;if(!el)return;const n=Math.max(0,Math.min(i,slots-1));el.scrollTo({top:n*el.clientHeight,behavior:instant||reducedMotion()?'auto':'smooth'})},[slots]);
  // Açılış / devam: etkin soru kartına anında konumlan
  useEffect(()=>{goTo(Math.max(0,2*(H-1)),true)},[]);// eslint-disable-line react-hooks/exhaustive-deps
  // Etkin kartı bul
  useEffect(()=>{
    const root=feedRef.current;if(!root||typeof IntersectionObserver==='undefined')return;
    const io=new IntersectionObserver(es=>{for(const e of es)if(e.isIntersecting&&e.intersectionRatio>=0.6)setActive(Number((e.target as HTMLElement).dataset.idx))},{root,threshold:[0.6]});
    root.querySelectorAll('[data-idx]').forEach(n=>io.observe(n));return()=>io.disconnect();
  },[slots,active]);
  // Sondaki boşluk etkinleşti: güncel kart terk edilir, sıradaki gelir
  useEffect(()=>{if(active===tail&&hasCurrent)w.next()},[active,tail,hasCurrent]);// eslint-disable-line react-hooks/exhaustive-deps
  // Kart değişince odak başlığa, duyuru, sonraki fotoğrafı önceden yükle, bekleyen otomatik geçişi iptal et
  useEffect(()=>{
    if(timer.current){clearTimeout(timer.current);timer.current=null}
    const el=heads.current.get(active);if(el)el.focus({preventScroll:true});
    const i=active>>1;const q=w.rows.get(ss.history[i]??'');
    if(q&&active<tail)setMsg(`${active%2?'Çözüm':'Soru'} ${i+1} / ${total}: ${q.subject}, ${q.topic}`);else if(active===tail&&!hasCurrent)setMsg('Oturum bitti.');
    const nx=ss.queue[0]?w.rows.get(ss.queue[0]):null;if(nx?.image_key&&typeof Image!=='undefined')new Image().src=`/api/questions/${nx.id}/image`;
  },[active,H]);// eslint-disable-line react-hooks/exhaustive-deps
  useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current)},[]);
  useEffect(()=>{if(w.live)setMsg(w.live)},[w.live]);

  const solIdx=curQ+1;
  const doMark=(o:'bildim'|'bilemedim',auto:boolean)=>{w.mark(o);if(timer.current)clearTimeout(timer.current);timer.current=null;if(auto&&!reducedMotion())timer.current=setTimeout(()=>goTo(solIdx+1),AUTO_MS)};
  const change=()=>{if(timer.current){clearTimeout(timer.current);timer.current=null}w.mark(ss.mark==='bildim'?'bilemedim':'bildim')};
  const pickLetter=(l:string)=>{const q=w.rows.get(ss.current??'');if(!q)return;const key=optionLetter(q.answer_key);if(!key)return;w.pick(H-1,l,key);goTo(solIdx)};

  // Klavye: yalnız odak metin alanında değilken, pencere açıkken değil
  useEffect(()=>{
    const on=(e:KeyboardEvent)=>{
      if(e.defaultPrevented||e.ctrlKey||e.metaKey||e.altKey||isField(e.target)||document.querySelector('[role=dialog],[role=alertdialog],[role=menu]:not([hidden])'))return;
      const t=e.target as HTMLElement;const k=e.key;const onBtn=!!t.closest?.('button,a,[role=menuitem]');const inScroll=!!t.closest?.('.scroll-body');
      const a=activeRef.current;const onCur=hasCurrent&&(a===curQ||a===curQ+1);
      if(k==='Escape'){e.preventDefault();w.exit();return}
      if(['ArrowDown','ArrowUp'].includes(k)&&inScroll)return;// kart içi kaydırma
      if((k===' '&&(onBtn||inScroll))||(k==='Enter'))return;
      if(k==='ArrowDown'||k===' '||k==='j'||k==='J'){e.preventDefault();goTo(a+1)}
      else if(k==='ArrowUp'||k==='k'||k==='K'){e.preventDefault();goTo(a-1)}
      else if(onCur&&(k==='1'||k==='2')){e.preventDefault();doMark(k==='1'?'bildim':'bilemedim',a===curQ+1)}
      else if(a===curQ&&hasCurrent&&/^[a-eA-E]$/.test(k)){e.preventDefault();pickLetter(k.toUpperCase())}
    };
    window.addEventListener('keydown',on);return()=>window.removeEventListener('keydown',on);
  });

  const lo=active-BEFORE,hi=active+AFTER;
  const cards=Array.from({length:slots},(_,idx)=>{
    if(idx===tail){
      if(hasCurrent)return <div key={idx} className="sw-ghost" data-idx={idx} aria-hidden="true"/>;
      const sm=summary(ss,[...w.rows.values()],today());
      return <EndCard key={idx} pos={idx+1} size={2*total+1} sm={sm} rows={w.rows} session={ss} headRef={el=>{if(el)heads.current.set(idx,el)}} onClose={w.exit} onHome={onHome}
        early={ss.scope==='due'?w.earlyCount(ss):0} learned={ss.scope==='all'&&!ss.includeLearned?w.learnedCount(ss):0} onEarly={w.continueEarly} onLearned={w.restartWithLearned} onRetry={w.retryStruggled}/>;
    }
    if(idx<lo||idx>hi)return <div key={idx} className="sw-ghost" data-idx={idx} aria-hidden="true"/>;
    const i=idx>>1;const q=w.rows.get(ss.history[i]);
    if(!q)return <div key={idx} className="sw-ghost" data-idx={idx} aria-hidden="true"><p>Bu soru silindi.</p></div>;
    const isCur=hasCurrent&&i===H-1;const meta:CardMeta={q,n:i+1,total,pos:idx+1,size:2*total+1};
    const hd=(el:HTMLElement|null)=>{if(el)heads.current.set(idx,el);else heads.current.delete(idx)};
    return <React.Fragment key={idx}>{idx%2===0
      ?<QuestionCard meta={meta} headRef={hd} current={isCur} picked={w.picks[i]??null} hint={i<HINT_CARDS} onClose={w.exit} onShowSolution={()=>goTo(idx+1)} onPick={pickLetter}/>
      :<SolutionCard meta={meta} headRef={hd} current={isCur} mark={isCur?ss.mark:null} result={ss.results[q.id]} picked={w.picks[i]??null} learned={w.learned.has(q.id)} online={w.online}
        note={isCur&&ss.mark?resultNote(q,ss.tiers[q.id]??'B',ss.mark,!!ss.results[q.id]?.first):''}
        onClose={w.exit} onMark={o=>doMark(o,true)} onChange={change} onNext={()=>goTo(idx+1)} onLearned={()=>void w.markLearned(q)}/>}</React.Fragment>;
  });
  return <><div className="sw-feed" role="feed" aria-label="Kaydır Çöz soruları" aria-busy="false" ref={feedRef} tabIndex={-1}>{cards}</div>
    <div className="sr-only" aria-live="polite" role="status">{msg}</div></>;
}
