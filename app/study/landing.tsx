"use client";
import {useEffect,useRef,type RefObject} from 'react';
import {ArrowRight,CalendarDays,Check,ChevronDown,CircleHelp,House,BookOpen,ChartNoAxesCombined,Search,Settings} from 'lucide-react';
import {Logo} from './logo';
import {NetChart,Tour,Features,How} from './landing-sections';

export type AuthMode='login'|'register';

// Ekranın altında kalan [data-rv] öğeleri görünür olunca yumuşakça belirir; hareket azaltma tercihinde hiçbir şey gizlenmez
export function useReveal(root:RefObject<HTMLElement|null>){
 useEffect(()=>{
  const el=root.current;if(!el||matchMedia('(prefers-reduced-motion: reduce)').matches||!('IntersectionObserver' in window))return;
  const io=new IntersectionObserver(es=>{for(const e of es)if(e.isIntersecting){e.target.classList.remove('rv-hide');e.target.classList.add('rv-show');io.unobserve(e.target)}},{rootMargin:'0px 0px -8% 0px',threshold:.08});
  for(const it of el.querySelectorAll<HTMLElement>('[data-rv]')){if(it.getBoundingClientRect().top>innerHeight*.92){it.classList.add('rv-hide');io.observe(it)}else it.classList.add('rv-show')}
  return()=>io.disconnect();
 },[root]);
}

// Kaydırma: üstte ilerleme çizgisi, menü gölgesi, açılış metninin hafif solması ve hangi bölümdeyse menüde vurgu
export function useScrollFx(root:RefObject<HTMLElement|null>){
 useEffect(()=>{
  const el=root.current;if(!el)return;
  const calm=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nav=el.querySelector('.lp-nav');let raf=0;
  const tick=()=>{raf=0;const y=scrollY;nav?.toggleAttribute('data-scrolled',y>8);if(calm)return;const max=document.documentElement.scrollHeight-innerHeight;el.style.setProperty('--sy',String(Math.min(y,900)));el.style.setProperty('--sp',String(max>0?y/max:0))};
  const onScroll=()=>{if(!raf)raf=requestAnimationFrame(tick)};
  addEventListener('scroll',onScroll,{passive:true});tick();
  const links=[...el.querySelectorAll<HTMLAnchorElement>('.lp-nav nav a')];
  const spy=new IntersectionObserver(es=>{for(const e of es)if(e.isIntersecting)for(const a of links)a.classList.toggle('on',a.getAttribute('href')==='#'+e.target.id)},{rootMargin:'-45% 0px -50% 0px'});
  for(const id of ['kesfet','ozellikler','nasil']){const s=document.getElementById(id);if(s)spy.observe(s)}
  return()=>{removeEventListener('scroll',onScroll);if(raf)cancelAnimationFrame(raf);spy.disconnect()};
 },[root]);
}

// Önizlemedeki tüm değerler örnektir (gerçek kullanıcı verisi değil)
const schedule=[{time:'09.00',subject:'Matematik',topic:'Türev – Konu tekrarı',done:3,total:5,checked:true},{time:'11.00',subject:'Türkçe',topic:'Paragraf – Soru çözümü',done:12,total:15,checked:false},{time:'14.00',subject:'Fizik',topic:'Elektrik – Konu tekrarı',done:2,total:4,checked:false}];
const sideNav=[{icon:House,label:'Genel bakış',on:true},{icon:CalendarDays,label:'Çalışma programım'},{icon:BookOpen,label:'Yanlış defterim'},{icon:ChartNoAxesCombined,label:'Deneme takvimim'}];
const steps=[{title:'Planını oluştur.',text:'Sana özel, gerçekçi bir çalışma programı ile her gün ne yapacağını bil.'},{title:'Yanlışlarından öğren.',text:'Tüm yanlışlarını tek bir yerde topla, konu konu analiz et, aynı hataları tekrarlama.'},{title:'Gelişimini gör.',text:'Deneme takvimiyle ilerlemeni takip et, hedefine her geçen gün daha da yaklaş.'}];

function Preview(){
 return <div className="lp-preview" role="img" aria-label="netudu panelinden örnek ekran: bugünün programı, net gelişimi ve yaklaşan deneme">
  <aside className="lp-side" aria-hidden="true">
   <Logo size={24}/>
   <ul>{sideNav.map(({icon:Icon,label,on})=><li key={label} className={on?'on':''}><Icon size={16}/>{label}</li>)}</ul>
   <ul className="lp-side-foot"><li><Settings size={16}/>Ayarlar</li><li><CircleHelp size={16}/>Yardım</li></ul>
  </aside>
  <div className="lp-main" aria-hidden="true">
   <div className="lp-main-top"><small>24 Ekim, Perşembe</small><span className="lp-user"><Search size={15}/><i>A</i>Ahmet<ChevronDown size={13}/></span></div>
   <div className="lp-main-grid">
    <div>
     <h2>Bugün, hedefine bir adım daha.</h2>
     <section className="lp-card"><header><b>Bugünün programı</b><span>Tümünü gör <ArrowRight size={12}/></span></header>
      <ul>{schedule.map(s=><li key={s.subject}><time>{s.time}</time><i className="lp-pip"/><div><b>{s.subject}</b><small>{s.topic}</small></div><div className="lp-bar"><span style={{width:`${(s.done/s.total)*100}%`}}/></div><small>{s.done}/{s.total}</small>{s.checked?<span className="lp-check on"><Check size={13}/></span>:<span className="lp-check"/>}</li>)}</ul>
     </section>
    </div>
    <div className="lp-col">
     <section className="lp-card"><header><b>Net gelişimim</b><span>Son 8 hafta <ChevronDown size={12}/></span></header><NetChart/></section>
     <section className="lp-card"><header><b>Yaklaşan denemeler</b><span>Tümünü gör <ArrowRight size={12}/></span></header>
      <div className="lp-exam"><div className="lp-date"><b>27</b><small>Ekim</small></div><div><b>TYT Genel Deneme</b><small>TYT • 120 soru • 165 dk</small></div><span className="lp-check"/></div>
     </section>
    </div>
   </div>
  </div>
 </div>
}

export function Landing({onAuth}:{onAuth:(m:AuthMode)=>void}){
 const root=useRef<HTMLDivElement>(null);useReveal(root);useScrollFx(root);
 return <div className="lp" ref={root}>
  <header className="lp-nav"><span className="lp-progress" aria-hidden="true"/><div className="lp-wrap lp-nav-in">
   <a href="#top" className="lp-logo" aria-label="netudu"><Logo size={36}/></a>
   <nav aria-label="Sayfa bölümleri"><a href="#ozellikler">Özellikler</a><a href="#nasil">Nasıl çalışır?</a></nav>
   <div className="lp-nav-actions"><button type="button" className="lp-link" onClick={()=>onAuth('login')}>Üye girişi</button><button type="button" className="lp-btn solid" onClick={()=>onAuth('register')}>Kayıt ol</button></div>
  </div></header>
  <main id="top">
   <section className="lp-hero lp-wrap">
    <div className="lp-hero-top"><p className="lp-kicker">YKS hazırlığının yeni düzeni</p>
    <h1><span>Tek hedef.</span><span className="lp-accent">Her şey yerli yerinde.</span></h1>
    <p className="lp-lead">Çalışma programın, yanlış defterin ve deneme takvimin.<br/>Hedefine giden yol, tek bir yerde.</p>
    <div className="lp-cta"><button type="button" className="lp-btn solid lg" onClick={()=>onAuth('register')}>Hemen başla <ArrowRight size={18}/></button><a className="lp-btn text" href="#kesfet">Netudu&apos;yu keşfet <ArrowRight size={16}/></a></div></div>
    <Preview/>
    <p className="lp-sample">Örnek ekran; gösterilen veriler örnektir.</p>
   </section>
   <section className="lp-wrap lp-steps" aria-label="Kısaca nasıl çalışır?"><ol>{steps.map((s,i)=><li key={s.title} data-rv style={{'--d':`${i*90}ms`} as React.CSSProperties}><span className="lp-num">{String(i+1).padStart(2,'0')}</span><div><h2>{s.title}</h2><p>{s.text}</p></div></li>)}</ol></section>
   <Tour/>
   <Features/>
   <How onStart={()=>onAuth('register')}/>
   <section className="lp-wrap lp-final" data-rv><h2>Bugünkü işinle başla.</h2><p>Hesabını bir dakikada aç, programını kur.</p><button type="button" className="lp-btn solid lg" onClick={()=>onAuth('register')}>Kayıt ol <ArrowRight size={18}/></button></section>
  </main>
  <footer className="lp-foot"><div className="lp-wrap"><Logo size={22}/><span>Created by Yusuf Kaya &amp; Kerem Batur Kanbak</span></div></footer>
 </div>
}
