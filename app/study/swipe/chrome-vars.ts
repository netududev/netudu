// Kabuk yüksekliklerini ölçüp .workspace üzerine --sw-top (üst çubuk) ve --sw-bar (mobil alt çubuk) yazar; akış yüksekliği buna göre hesaplanır.
// CSS'teki sabit değerler yedektir (ölçülemezse ya da çubuk gizliyse). Dar ekranda "Daha fazla" iki satıra kırılınca alt çubuk uzar; ResizeObserver bunu izler.
export function watchChrome():()=>void{
  if(typeof document==='undefined')return()=>{};
  const host=document.querySelector('.view[data-view=swipe]')?.closest<HTMLElement>('.workspace');if(!host)return()=>{};
  const targets:[string,string][]=[['.topbar','--sw-top'],['.mobile-bar','--sw-bar']];
  const sync=()=>{for(const [sel,v] of targets){const el=document.querySelector<HTMLElement>(sel);const h=el?el.getBoundingClientRect().height:0;if(h>0)host.style.setProperty(v,Math.ceil(h)+'px');else host.style.removeProperty(v)}};
  sync();
  const ro=typeof ResizeObserver!=='undefined'?new ResizeObserver(sync):null;
  if(ro)for(const [sel] of targets){const el=document.querySelector(sel);if(el)ro.observe(el)}
  window.addEventListener('resize',sync);
  return()=>{ro?.disconnect();window.removeEventListener('resize',sync);for(const [,v] of targets)host.style.removeProperty(v)};
}
