"use client";
import {TriangleAlert,Check,ArrowRight} from 'lucide-react';
import {monthlyPriceLabel,priceSummary,trialLabel,PAYMENT_NOTE} from '@/lib/pricing';

// Bu dosyadaki tüm örnek ekranlar ve sayılar gösterim amaçlıdır (gerçek kullanıcı verisi değil)
export const netSeries=[28,42,52,60,68,84,92,108];

export function NetChart(){
 const w=330,h=104,top=12,max=120,x=(i:number)=>12+i*((w-24)/(netSeries.length-1)),y=(v:number)=>top+h-(v/max)*h;
 const pts=netSeries.map((v,i)=>`${x(i).toFixed(1)},${y(v).toFixed(1)}`);
 return <svg viewBox={`0 0 ${w} ${top+h+22}`} role="img" aria-label="Son 8 haftada net gelişimi: 28 netten 108 nete yükseliyor" className="lp-chart">
  {netSeries.map((_,i)=><line key={i} x1={x(i)} x2={x(i)} y1={top} y2={top+h} className="lp-vgrid"/>)}
  {[0,40,80,120].map(g=><g key={g}><line x1="0" x2={w} y1={y(g)} y2={y(g)} className="lp-grid"/><text x="0" y={y(g)-3} className="lp-axis">{g}</text></g>)}
  <polygon points={`${x(0)},${top+h} ${pts.join(' ')} ${x(netSeries.length-1)},${top+h}`} className="lp-area"/>
  <polyline points={pts.join(' ')} fill="none" pathLength="1" className="lp-line"/>
  {netSeries.map((v,i)=><circle key={i} cx={x(i)} cy={y(v)} r="3" className="lp-dot"/>)}
  {netSeries.map((_,i)=><text key={i} x={x(i)} y={top+h+16} textAnchor="middle" className="lp-axis">{i+1}. hf</text>)}
 </svg>
}

/* ───────── ÜÇ ADIM ───────── */
const steps=[
 {title:'Saatlerini gir.',text:'Okul ve dershane saatlerini yaz, temponu seç.'},
 {title:'Programın hazır.',text:'Konular boş saatlerine çakışmadan yerleşir.'},
 {title:'Her gün tek işe bak.',text:'Bugün ekranı sıradaki işi gösterir. Tamamladıkça ilerlemen dolar.'},
];
export function Steps(){
 return <section id="nasil" className="lp-wrap lp-how" aria-labelledby="lp-how-title">
  <h2 id="lp-how-title" data-rv>Üç adımda başla.</h2>
  <ol>{steps.map((s,i)=><li key={s.title} data-rv style={{'--d':`${i*90}ms`} as React.CSSProperties}><span className="lp-num" aria-hidden="true">{i+1}</span><h3>{s.title}</h3><p>{s.text}</p></li>)}</ol>
 </section>
}

/* ───────── ÜÇ FAYDA: başlık + tek cümle + tek görsel ───────── */
function DayVisual(){
 const rows=[{t:'08:00',n:'Okul',d:'16:00’ya kadar',k:'school'},{t:'17:00',n:'Matematik · Türev',d:'Konu tekrarı, 1 saat 20 dk',k:'study'},{t:'19:30',n:'Dershane',d:'Sabit saatin',k:'fixed'},{t:'21:00',n:'Yanlış tekrarı',d:'Sırası gelen 4 soru',k:'review'}];
 return <div className="sx-day"><header><b>Bugünün akışı</b><span>Çakışma yok</span></header><ol>{rows.map(r=><li key={r.t} data-k={r.k}><time>{r.t}</time><i/><div><b>{r.n}</b><small>{r.d}</small></div></li>)}</ol></div>
}
function NoteVisual(){
 return <div className="sx-note">
  <div className="sx-photo" aria-hidden="true"><span style={{width:'86%'}}/><span style={{width:'62%'}}/><span style={{width:'74%'}}/><em>f(x) = x³ − 3x</em><span style={{width:'48%'}}/></div>
  <div className="sx-solve">
   <div className="sx-chips"><span className="sx-chip brand">Matematik · Türev</span><span className="sx-chip bad"><TriangleAlert size={12}/> İşaret hatası</span></div>
   <ol><li>Türevi al: f′(x) = 3x² − 3</li><li>Sıfıra eşitle: x = −1 ve x = 1</li><li>İşaret tablosundan yorumla</li></ol>
   <div className="sx-next" aria-label="Aralıklı tekrar takvimi"><small>Sıradaki tekrar</small><ul>{[1,3,7,14,30,60].map(d=><li key={d} className={d===3?'on':''}>{d}</li>)}</ul></div>
  </div>
 </div>
}
function ExamVisual(){
 const days=Array.from({length:35},(_,i)=>i-2); // Ekim ayı Perşembe başlar (Pzt başlangıçlı hafta)
 const mark:Record<number,string>={13:'past',20:'past',27:'exam'};
 return <div className="sx-cal">
  <div className="sx-month"><b>Ekim</b><div className="sx-dow">{['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'].map(d=><i key={d}>{d}</i>)}</div>
   <div className="sx-grid">{days.map((d,i)=><span key={i} className={d<1||d>31?'off':mark[d]||''}>{d>=1&&d<=31?d:''}</span>)}</div></div>
  <div className="sx-exams"><b>Denemelerin</b><ul><li data-k="exam"><time>27 Ekim</time><span>TYT Genel Deneme</span></li><li><time>20 Ekim</time><span>Net 96</span></li><li><time>13 Ekim</time><span>Net 84</span></li></ul></div>
 </div>
}
const benefits=[
 {id:'program',tag:'Program',title:'Her günün işi hazır.',text:'Okul ve dershaneyle çakışmayan saatlik plan. Çalışamadığın günde dersler bir gün ileri kayar.',visual:<DayVisual/>},
 {id:'defter',tag:'Yanlış defteri',title:'Yanlışın çözümüyle saklansın.',text:'Soru fotoğrafını yükle. Çözüm, Maarif Modeli ders programındaki konu ve tekrar günleri hazır gelir.',visual:<NoteVisual/>},
 {id:'deneme',tag:'Deneme ve net',title:'Netlerinin yönünü gör.',text:'Denemelerini gir. Gelişimin ve en çok zorlandığın konular tek yerde toplanır.',visual:<ExamVisual/>},
];
export function Benefits(){
 return <section id="faydalar" className="lp-wrap lp-benefits" aria-label="Özellikler">
  {benefits.map(b=><article key={b.id} className="lp-benefit" data-rv>
   <div className="lp-benefit-text"><span className="lp-tag">{b.tag}</span><h2>{b.title}</h2><p>{b.text}</p></div>
   <figure className="lp-benefit-art">{b.visual}<figcaption>Örnek ekran; gösterilen veriler örnektir.</figcaption></figure>
  </article>)}
 </section>
}

/* ───────── FİYAT: tek plan kartı; tüm değerler lib/pricing.ts'ten gelir ───────── */
// Yalnız kodda var olan özellikler listelenir.
const planFeatures=[
 'Okul ve dershane saatlerine göre günlük program',
 'Soru fotoğrafından çözüm ve konu, yanlış defteri',
 'Aralıklı tekrar: 1, 3, 7, 14, 30 ve 60. gün',
 'Deneme ve net takibi',
 'Aylık rapor ve ders notları',
 'Excel, PDF çıktısı ve yedek',
];
export function Pricing({onStart}:{onStart:()=>void}){
 return <section id="fiyat" className="lp-wrap lp-pricing" aria-labelledby="lp-price-title">
  <h2 id="lp-price-title" data-rv>Tek plan, tüm özellikler.</h2>
  <article className="lp-plan" data-rv>
   <span className="lp-plan-badge">{trialLabel()}</span>
   <h3>netudu üyeliği</h3>
   <p className="lp-plan-price"><b>{monthlyPriceLabel()}</b><span>/ ay</span></p>
   <p className="lp-plan-note">{priceSummary()}</p>
   <ul>{planFeatures.map(f=><li key={f}><Check size={16} aria-hidden="true"/>{f}</li>)}</ul>
   <button type="button" className="lp-btn solid lg" onClick={onStart}>Ücretsiz dene <ArrowRight size={18}/></button>
   <small>{PAYMENT_NOTE}</small>
  </article>
 </section>
}
