"use client";
// Kaydır Çöz: çözüm kartı (sonuç bandı, adımlar, kritik nokta, konu notu), sabit alt çubuk ve ⋯ menüsü
import {useState} from 'react';
import {MoreHorizontal,Sparkles,LoaderCircle,Play,Check,BookOpen} from '@/components/icons';
import {DropdownMenu,DropdownMenuTrigger,DropdownMenuContent,DropdownMenuItem} from '@/components/ui/dropdown-menu';
import {hasSolution,type Question} from '@/lib/study';
import type {CardResult,Outcome} from '@/lib/swipe/session';
import {optionLetter} from '@/lib/swipe/answer';
import {QuotaNote,useStudy} from '../shared';
import {CardStrip,type CardMeta} from './question-card';
import {outcomeLabel} from './use-swipe-session';

type Props={meta:CardMeta;headRef:(el:HTMLElement|null)=>void;current:boolean;mark:Outcome|null;result?:CardResult;picked:string|null;note:string;learned:boolean;online:boolean;
  onClose:()=>void;onMark:(o:Outcome)=>void;onChange:()=>void;onNext:()=>void;onLearned:()=>void};
const leftOutcome=(r?:CardResult):Outcome=>r?.first??'atlandi';

export function SolutionCard(p:Props){
  const s=useStudy();const {meta,current,mark,picked}=p;const {q,pos,size}=meta;const a=q.analysis;const id=`sw-s-${pos}`;
  const solved=hasSolution(a)&&a!.readable;const unreadable=hasSolution(a)&&!a!.readable;
  const key=optionLetter(q.answer_key);const answer=q.answer_key?.trim()||(solved?a!.answer:'');
  const correct=picked&&key?picked===key:null;
  const [more,setMore]=useState(false);const busy=s.solving.has(q.id);
  const shown=current?mark:leftOutcome(p.result);
  const noteLines=solved?(a!.note||'').split('\n').filter(Boolean):[];const longNote=noteLines.length>2||(a?.note||'').length>180;
  const menu=<DropdownMenu><DropdownMenuTrigger asChild><button type="button" className="sw-more icon-button" aria-label="Diğer eylemler"><MoreHorizontal size={20}/></button></DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="export-menu"><DropdownMenuItem onSelect={()=>s.select(q)}><BookOpen size={16}/> Soruyu aç</DropdownMenuItem>
      <DropdownMenuItem disabled={!p.online} onSelect={()=>{const v=a?.videos?.[0];if(v?.url)window.open(v.url,'_blank','noopener');else s.select(q)}}><Play size={16}/> Konu videosu{!p.online?' · Bağlantı yok':''}</DropdownMenuItem>
      <DropdownMenuItem disabled={p.learned||!p.online} onSelect={p.onLearned}><Check size={16}/> Öğrendim, artık gösterme</DropdownMenuItem></DropdownMenuContent></DropdownMenu>;
  return <article className="sw-card sw-s" data-idx={pos-1} aria-labelledby={id} aria-posinset={pos} aria-setsize={size}>
    <CardStrip meta={meta} label="Çözüm" id={id} headRef={p.headRef} onClose={p.onClose} extra={menu}/>
    <div className="scroll-body" tabIndex={0} aria-label="Çözüm">
      {unreadable?<p className="sw-unreadable" role="status">Fotoğraf okunamadı. Daha net bir fotoğrafla yeniden ekleyebilirsin.</p>:null}
      <div className={'sw-band'+(correct===true?' good':correct===false?' bad':'')}>
        <strong>{answer?`Doğru cevap: ${answer}`:'Cevap anahtarı yok'}</strong>{picked&&<span>Sen: {picked}</span>}
      </div>
      {current&&mark&&<p className="sw-result" role="status">{outcomeLabel(mark)}. {p.note}</p>}
      {!current&&<p className="sw-result">Sonuç: {outcomeLabel(shown)}</p>}
      {solved?<>
        <ol className="sw-steps">{a!.steps.map((st,i)=><li key={i}>{st}</li>)}</ol>
        {a!.pitfall&&<div className="sw-pitfall"><strong>Kritik nokta</strong><p>{a!.pitfall}</p></div>}
        {a!.note&&<div className="sw-note"><strong>Konu notu</strong><p className={more?'':'clamp'}>{a!.note}</p>{longNote&&!more&&<button type="button" className="text-button" onClick={()=>setMore(true)}>Devamı</button>}</div>}
      </>:!unreadable&&<div className="sw-nosol"><p>Bu soru için çözüm hazırlanmamış.</p>
        <button type="button" className="secondary" disabled={busy||!s.ai||!p.online} onClick={()=>void s.solve(q)}>{busy?<LoaderCircle className="spin" size={17}/>:<Sparkles size={17}/>} Yapay zekâyla çöz</button>
        {!p.online?<span className="quota-note">Bağlantı yok</span>:<QuotaNote kind="solve"/>}</div>}
    </div>
    <footer className="sw-bar">
      {current&&!p.learned?(mark===null
        ?<><button type="button" className="secondary" onClick={()=>p.onMark('bilemedim')}>Bilemedim</button><button type="button" className="primary" onClick={()=>p.onMark('bildim')}>Bildim</button></>
        :<><button type="button" className="secondary" onClick={p.onChange}>Sonucu değiştir</button><button type="button" className="primary" onClick={p.onNext}>Sonraki</button></>)
        :<><span className="sw-learned">{p.learned?'Öğrenildi olarak işaretlendi':''}</span><button type="button" className={p.learned&&current?'primary':'secondary'} onClick={p.onNext}>Sonraki</button></>}
    </footer>
  </article>;
}
