"use client";
// Kaydır Çöz: kart üst şeridi, soru kartı ve fotoğraf görüntüleyici. Cevap anahtarı soru kartında ASLA gösterilmez (yalnız şık harfleri).
import {useState} from 'react';
import {X,ChevronUpIcon as ChevronUp} from '@/components/icons';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import type {Question} from '@/lib/study';
import {optionLetter} from '@/lib/swipe/answer';

export const LETTERS=['A','B','C','D','E'];
export type CardMeta={q:Question;n:number;total:number;pos:number;size:number};// n: kaçıncı soru (1'den), total: soru sayısı, pos/size: feed içindeki konum
export const photoAlt=(q:Question)=>q.analysis?.transcription?.trim()||`Soru fotoğrafı, ${q.subject}, ${q.topic}`;
export const prevLine=(q:Question)=>q.my_answer?.trim()?`Daha önce: ${q.my_answer.trim()} dedin`:'Daha önce: boş bıraktın';

// Üst şerit: kapat, ders çipi + konu, ilerleme ve çok ince ilerleme çizgisi. Başlık (h2) odak hedefidir.
export function CardStrip({meta,label,id,headRef,onClose,extra}:{meta:CardMeta;label:'Soru'|'Çözüm';id:string;headRef:(el:HTMLElement|null)=>void;onClose:()=>void;extra?:React.ReactNode}){
  const {q,n,total}=meta;
  return <header className="sw-strip">
    <button type="button" className="sw-close icon-button" aria-label="Kaydır Çöz'ü kapat" onClick={onClose}><X size={20}/></button>
    <h2 className="sw-title" id={id} tabIndex={-1} ref={headRef}>{label==='Soru'
      ?<><span className="sr-only">Soru {n}: </span><span className="sw-chip">{q.subject}</span><span className="sr-only">, </span><span className="sw-topic">{q.topic}</span></>
      :<><span className="sw-label">Çözüm {n}</span><span className="sr-only">: </span><span className="sw-topic">{q.topic}</span></>}</h2>
    <span className="sw-progress" aria-hidden="true">{n} / {total}</span>
    {extra}
    <span className="sw-line" aria-hidden="true"><i style={{width:`${Math.min(100,Math.round(n/Math.max(total,1)*100))}%`}}/></span>
  </header>;
}

export function PhotoViewer({q,onClose}:{q:Question;onClose:()=>void}){
  return <Dialog open onOpenChange={v=>{if(!v)onClose()}}><DialogContent className="sw-viewer"><DialogHeader><DialogTitle className="sr-only">Soru fotoğrafı</DialogTitle><DialogDescription className="sr-only">{q.subject}, {q.topic}. İki parmakla yakınlaştırabilirsin.</DialogDescription></DialogHeader>
    <div className="sw-viewer-scroll"><img src={`/api/questions/${q.id}/image`} alt={photoAlt(q)}/></div></DialogContent></Dialog>;
}

export function QuestionCard({meta,headRef,current,picked,hint,onClose,onShowSolution,onPick}:{meta:CardMeta;headRef:(el:HTMLElement|null)=>void;current:boolean;picked:string|null;hint:boolean;onClose:()=>void;onShowSolution:()=>void;onPick:(letter:string)=>void}){
  const {q,n,pos,size}=meta;const [zoom,setZoom]=useState(false);const key=optionLetter(q.answer_key);const id=`sw-q-${pos}`;
  return <article className="sw-card sw-q" data-idx={pos-1} aria-labelledby={id} aria-posinset={pos} aria-setsize={size}>
    <CardStrip meta={meta} label="Soru" id={id} headRef={headRef} onClose={onClose}/>
    <div className="scroll-body">
      {q.image_key
        ?<button type="button" className="sw-photo" onClick={()=>setZoom(true)}><img src={`/api/questions/${q.id}/image`} alt={photoAlt(q)} loading={current?'eager':'lazy'} decoding="async" {...(current?{fetchPriority:'high' as const}:{})}/><span className="sr-only">Büyütmek için Enter&apos;a bas</span></button>
        :<p className="sw-qtext">{q.question||'Bu soruda fotoğraf ya da metin yok.'}</p>}
      <p className="sw-prev">{prevLine(q)}</p>
    </div>
    {key&&<div className="sw-opts" role="group" aria-label="Şıklar">{LETTERS.map(l=><button type="button" key={l} className={'sw-opt secondary'+(picked===l?' on':'')} disabled={!current||!!picked} aria-pressed={picked===l} onClick={()=>onPick(l)}>{l}</button>)}</div>}
    <footer className="sw-foot">
      {hint&&<p className="sw-hint"><ChevronUp size={16}/> Çözümü görmek için yukarı kaydır</p>}
      <button type="button" className="secondary sw-show" onClick={onShowSolution}>Çözümü göster</button>
    </footer>
    {zoom&&<PhotoViewer q={q} onClose={()=>setZoom(false)}/>}
  </article>;
}
