import {Lightbulb,ArrowRight} from '@/components/icons';
import {parseNoteContent,type VisualNote,type NoteDiagram} from '@/lib/note-format';
// Ders notu gövdesi: görsel not (ndnote1 öneki) kartlar ve şemalar olarak, eski düz metin not eskisi gibi çizilir.
export function NoteBody({content}:{content:string}){
 const p=parseNoteContent(content);
 return p.kind==='visual'?<VisualNoteView note={p.note}/>:<div className="note-content prewrap">{p.text}</div>;
}
function Layers({items,depth=0}:{items:NonNullable<VisualNote['layers']>;depth?:number}){
 const [first,...rest]=items;
 return <div className={'nv-layer d'+(depth%4)}><span className="nv-layer-label">{first.label}</span><span className="nv-layer-text">{first.text}</span>{rest.length>0&&<Layers items={rest} depth={depth+1}/>}</div>;
}
function Diagram({d}:{d:NoteDiagram}){
 const title=d.title||(d.type==='flow'?'Adım adım akış':d.type==='compare'?'Karşılaştırma':'Döngü');
 return <figure className={'nv-fig nv-'+d.type}><figcaption>{title}</figcaption>
  {d.type==='flow'?<ol className="nv-flow">{d.items.map((it,i)=><li key={i}><span className="nv-flow-n" aria-hidden="true">{i+1}</span><span className="nv-flow-b"><b>{it.label}</b>{it.text&&<small>{it.text}</small>}</span>{i<d.items.length-1&&<ArrowRight className="nv-flow-arrow" size={16} aria-hidden="true"/>}</li>)}</ol>
  :d.type==='compare'?<div className="nv-compare" style={{'--cols':d.items.length} as React.CSSProperties}>{d.items.map((it,i)=><div key={i} className={'nv-col c'+(i%3)}><b>{it.label}</b>{it.text&&<small>{it.text}</small>}{it.points&&<ul>{it.points.map(pt=><li key={pt}>{pt}</li>)}</ul>}</div>)}</div>
  :<div className="nv-cycle-wrap"><svg viewBox="0 0 100 100" aria-hidden="true" focusable="false"><circle cx="50" cy="50" r="31" fill="none" strokeDasharray="2.2 2.6"/><path d="M56.6 18.2l-5.8 1.2 3.4 4.6" fill="none"/></svg><span className="nv-cycle-core" aria-hidden="true">↻</span>
   <ol className="nv-cycle" data-n={d.items.length}>{d.items.map((it,i)=>{const a=-Math.PI/2+i*2*Math.PI/d.items.length;return <li key={i} style={{left:`${50+31*Math.cos(a)}%`,top:`${50+31*Math.sin(a)}%`}}><span className="nv-cycle-n" aria-hidden="true">{i+1}</span><b>{it.label}</b>{it.text&&<small>{it.text}</small>}</li>})}</ol></div>}
 </figure>;
}
export function VisualNoteView({note:n}:{note:VisualNote}){
 return <div className="nv">
  <p className="nv-lead">{n.oneLiner}</p>
  {n.layers&&<figure className="nv-fig"><figcaption>Katman katman gör</figcaption><Layers items={n.layers}/></figure>}
  {n.diagram&&<Diagram d={n.diagram}/>}
  {n.rule&&<div className="nv-rule"><span className="nv-eyebrow">KURAL</span><strong>{n.rule.formula}</strong><p>{n.rule.plain}</p></div>}
  {n.steps&&<section className="nv-steps" aria-label="Çözülmüş örnek"><h3>Çözülmüş örnek</h3><ol>{n.steps.map((s,i)=><li key={i}><span className={'nv-step-n s'+(i%3)} aria-hidden="true">{i+1}</span><span className="nv-step-b"><b>{s.title}</b><span>{s.body}</span></span></li>)}</ol></section>}
  {(n.mistakes||n.patterns)&&<div className="nv-pair">{n.mistakes?.map(m=><div key={m} className="nv-card"><span className="nv-eyebrow warm">SIK HATA</span><span>{m}</span></div>)}{n.patterns?.map(p=><div key={p.q} className="nv-card"><span className="nv-eyebrow cool">AYNI KALIP</span><span>{p.q} = <b>{p.a}</b></span></div>)}</div>}
  {n.memory&&<p className="nv-memory"><Lightbulb size={26}/><span><b>Akılda tut:</b> {n.memory}</span></p>}
 </div>;
}
