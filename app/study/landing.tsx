"use client";
import {useEffect,useRef,type RefObject} from 'react';
import {ArrowRight,CalendarDays,Check,ChevronDown,CircleHelp,House,BookOpen,ChartNoAxesCombined,Search,Settings} from '@/components/icons';
import {Logo} from './logo';
import {NetChart,Steps,Benefits,Pricing} from './landing-sections';
import {priceSummary} from '@/lib/pricing';

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
  for(const id of ['nasil','faydalar','fiyat']){const s=document.getElementById(id);if(s)spy.observe(s)}
  return()=>{removeEventListener('scroll',onScroll);if(raf)cancelAnimationFrame(raf);spy.disconnect()};
 },[root]);
}

// Önizlemedeki tüm değerler örnektir (gerçek kullanıcı verisi değil)
const schedule=[{time:'09.00',subject:'Matematik',topic:'Türev – Konu tekrarı',done:3,total:5,checked:true},{time:'11.00',subject:'Türkçe',topic:'Paragraf – Soru çözümü',done:12,total:15,checked:false},{time:'14.00',subject:'Fizik',topic:'Elektrik – Konu tekrarı',done:2,total:4,checked:false}];
const sideNav=[{icon:House,label:'Bugün',on:true},{icon:CalendarDays,label:'Program'},{icon:BookOpen,label:'Yanlış defteri'},{icon:ChartNoAxesCombined,label:'Denemeler'}];

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
     <h2>Bugün, hedef netine bir adım.</h2>
     <section className="lp-card"><header><b>Bugünün programı</b><span>Tümünü gör <ArrowRight size={12}/></span></header>
      <ul>{schedule.map(s=><li key={s.subject}><time>{s.time}</time><i className="lp-pip"/><div><b>{s.subject}</b><small>{s.topic}</small></div><div className="lp-bar"><span style={{width:`${(s.done/s.total)*100}%`}}/></div><small>{s.done}/{s.total}</small>{s.checked?<span className="lp-check on"><Check size={13}/></span>:<span className="lp-check"/>}</li>)}</ul>
     </section>
    </div>
    <div className="lp-col">
     <section className="lp-card"><header><b>Net gelişimi</b><span>Son 8 hafta <ChevronDown size={12}/></span></header><NetChart/></section>
     <section className="lp-card"><header><b>Yaklaşan deneme</b><span>Tümünü gör <ArrowRight size={12}/></span></header>
      <div className="lp-exam"><div className="lp-date"><b>27</b><small>Ekim</small></div><div><b>TYT Genel Deneme</b><small>TYT • 120 soru • 165 dk</small></div><span className="lp-check"/></div>
     </section>
    </div>
   </div>
  </div>
 </div>
}

const CTA='Programı oluştur';
export function Landing({onAuth}:{onAuth:(m:AuthMode)=>void}){
 const root=useRef<HTMLDivElement>(null);useReveal(root);useScrollFx(root);
 const start=()=>onAuth('register');
 return <div className="lp" ref={root}>
  <header className="lp-nav"><span className="lp-progress" aria-hidden="true"/><div className="lp-wrap lp-nav-in">
   <a href="#top" className="lp-logo" aria-label="netudu"><Logo size={32}/></a>
   <nav aria-label="Sayfa bölümleri"><a href="#nasil">Nasıl çalışır</a><a href="#faydalar">Özellikler</a><a href="#fiyat">Fiyat</a></nav>
   <div className="lp-nav-actions"><button type="button" className="lp-link" onClick={()=>onAuth('login')}>Giriş yap</button><button type="button" className="lp-btn solid" onClick={start}>{CTA}</button></div>
  </div></header>
  <main id="top">
   <section className="lp-hero lp-wrap">
    <div className="lp-hero-top">
     <h1>Her gün <span className="lp-accent">ne çalışacağını</span> bil.</h1>
     <p className="lp-lead">YKS netin için çalışma programın, yanlış defterin ve deneme netlerin tek yerde. Konu listeleri Türkiye Yüzyılı Maarif Modeli ders programlarına göre.</p>
     <div className="lp-cta"><button type="button" className="lp-btn solid lg" onClick={start}>{CTA} <ArrowRight size={18}/></button><p className="lp-micro">{priceSummary()}</p><button type="button" className="lp-quiet" onClick={()=>onAuth('login')}>Hesabın var mı? Giriş yap</button></div>
    </div>
    <Preview/>
    <p className="lp-sample">Örnek ekran. Gösterilen veriler örnektir.</p>
   </section>
   <Steps/>
   <Benefits/>
   <Pricing onStart={start}/>
   <section className="lp-wrap lp-close" data-rv><h2>Programını bugün kur.</h2><button type="button" className="lp-btn solid lg" onClick={start}>{CTA} <ArrowRight size={18}/></button><p className="lp-micro">{priceSummary()}</p></section>
  </main>
  <footer className="lp-foot"><div className="lp-wrap"><Logo size={22}/><span>Created by Yusuf Kaya &amp; Kerem Batur Kanbak</span></div></footer>
 </div>
}
