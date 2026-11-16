"use client";
import {useEffect,useRef,type RefObject} from 'react';
import {ArrowRight} from '@/components/icons';
import {Logo} from './logo';
import {Steps,Benefits,Pricing} from './landing-sections';
import {HeroVisual} from './landing-hero';
import {priceSummary,monthlyPriceLabel} from '@/lib/pricing';

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
  const tick=()=>{raf=0;const y=scrollY;nav?.toggleAttribute('data-scrolled',y>8);if(calm)return;const max=document.documentElement.scrollHeight-innerHeight;el.style.setProperty('--sp',String(max>0?y/max:0))};
  const onScroll=()=>{if(!raf)raf=requestAnimationFrame(tick)};
  addEventListener('scroll',onScroll,{passive:true});tick();
  const links=[...el.querySelectorAll<HTMLAnchorElement>('.lp-nav nav a')];
  const spy=new IntersectionObserver(es=>{for(const e of es)if(e.isIntersecting)for(const a of links)a.classList.toggle('on',a.getAttribute('href')==='#'+e.target.id)},{rootMargin:'-45% 0px -50% 0px'});
  for(const id of ['nasil','faydalar','fiyat']){const s=document.getElementById(id);if(s)spy.observe(s)}
  return()=>{removeEventListener('scroll',onScroll);if(raf)cancelAnimationFrame(raf);spy.disconnect()};
 },[root]);
}

const CTA='7 gün ücretsiz dene';
export function Landing({onAuth}:{onAuth:(m:AuthMode)=>void}){
 const root=useRef<HTMLDivElement>(null);useReveal(root);useScrollFx(root);
 const start=()=>onAuth('register');
 return <div className="lp" ref={root}>
  <header className="lp-nav"><span className="lp-progress" aria-hidden="true"/><div className="lp-wrap lp-nav-in">
   <a href="#top" className="lp-logo" aria-label="netudu"><Logo size={32}/></a>
   <nav aria-label="Sayfa bölümleri"><a href="#nasil">Nasıl çalışır</a><a href="#faydalar">Ne kazanırsın</a><a href="#fiyat">Fiyat</a></nav>
   <div className="lp-nav-actions"><button type="button" className="lp-link" onClick={()=>onAuth('login')}>Giriş yap</button><button type="button" className="lp-btn ink" onClick={start}>{CTA}</button></div>
  </div></header>
  <main id="top">
   <section className="lp-hero lp-wrap" aria-labelledby="lp-hero-title">
    <div className="lp-hero-copy">
     <p className="lp-kicker">YKS · TYT · AYT</p>
     <h1 id="lp-hero-title">Soruyu çek.<br/>Gerisini <span className="lp-accent">netudu</span> bilsin.</h1>
     <p className="lp-lead">Yanlış yaptığın sorunun fotoğrafını çek; dersini, konusunu ve alt konusunu yapay zekâ bulsun. Tekrarı programın günü gelince önüne koysun.</p>
     <div className="lp-cta"><button type="button" className="lp-btn solid lg" onClick={start}>7 gün ücretsiz başla <ArrowRight size={18}/></button><a className="lp-quiet lg" href="#nasil">Nasıl çalıştığını gör</a></div>
     <ul className="lp-assure"><li>Deneme sonrası <b>{monthlyPriceLabel()} / ay</b></li><li>Kart bilgisi istemez</li><li>İstediğin an bırak</li></ul>
    </div>
    <HeroVisual/>
    <p className="lp-sample">Örnek ekran. Gösterilen veriler örnektir.</p>
   </section>
   <Steps/>
   <Benefits/>
   <Pricing onStart={start}/>
   <section className="lp-wrap lp-close" data-rv><h2>Programını bugün kur.</h2><button type="button" className="lp-btn ink lg" onClick={start}>{CTA} <ArrowRight size={18}/></button><p className="lp-micro">{priceSummary()}</p></section>
  </main>
  <footer className="lp-foot"><div className="lp-wrap"><Logo size={22}/><span>Created by Yusuf Kaya &amp; Kerem Batur Kanbak</span></div></footer>
 </div>
}
