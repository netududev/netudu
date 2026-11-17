#!/usr/bin/env node
// Yayındaki CSS paketinin güncel olup olmadığını denetler.
//
// Kullanım:
//   node scripts/check-css.mjs <URL>
//   örn. node scripts/check-css.mjs https://netudu-kohl.vercel.app
//
// URL'nin HTML'ini indirir, <link rel="stylesheet"> adreslerini çıkarıp hepsini
// indirir ve birleştirir. Gerekli işaret sınıflarından biri yoksa ya da yasaklı
// dizelerden biri varsa sorunu yazdırıp 1 ile çıkar; aksi halde 0.
import {pathToFileURL} from 'node:url';

// Güncel yayında bulunması GEREKEN sınıflar (eskimiş paket bunları taşımaz)
export const REQUIRED=['lp-sheet','tag-card','nv-flow'];
// Güncel yayında BULUNMAMASI gereken dizeler (eski paketten kalıntı)
export const FORBIDDEN=['--glow-a','ndDrift'];

export function analyzeCss(cssText,{required=REQUIRED,forbidden=FORBIDDEN}={}){
  const missing=required.filter(s=>!cssText.includes('.'+s));
  const forbiddenFound=forbidden.filter(s=>cssText.includes(s));
  return {ok:missing.length===0&&forbiddenFound.length===0,missing,forbiddenFound};
}

export function extractStylesheetHrefs(html,baseUrl){
  const hrefs=[];
  for(const [tag] of html.matchAll(/<link\b[^>]*>/gi)){
    const rm=tag.match(/\brel\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const rel=(rm&&(rm[1]??rm[2]??rm[3])||'').toLowerCase().split(/\s+/);
    if(!rel.includes('stylesheet')||rel.includes('alternate'))continue;
    const m=tag.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const href=m&&(m[1]??m[2]??m[3])?.replaceAll('&amp;','&');
    if(!href)continue;
    const abs=new URL(href,baseUrl).href;
    if(!hrefs.includes(abs))hrefs.push(abs);
  }
  return hrefs;
}

async function fetchText(url){
  const res=await fetch(url,{signal:AbortSignal.timeout(15000)});
  if(!res.ok)throw new Error(`${url} -> HTTP ${res.status}`);
  return res.text();
}

async function main(url){
  if(!url){console.error('Kullanım: node scripts/check-css.mjs <URL>');return 2}
  const html=await fetchText(url);
  const hrefs=extractStylesheetHrefs(html,url);
  if(!hrefs.length){console.error('HATA: sayfada stylesheet bağlantısı bulunamadı');return 1}
  const parts=await Promise.all(hrefs.map(fetchText));
  const css=parts.join('\n');
  console.log(`${hrefs.length} stylesheet, ${css.length} bayt`);
  hrefs.forEach(h=>console.log('  '+h));
  const r=analyzeCss(css,{required:REQUIRED,forbidden:FORBIDDEN});
  r.missing.forEach(s=>console.log(`SORUN: gerekli sınıf yok: ${s}`));
  r.forbiddenFound.forEach(s=>console.log(`SORUN: yasaklı dize var: ${s}`));
  console.log(r.ok?'TAMAM: CSS güncel':'BAŞARISIZ: CSS eski görünüyor');
  return r.ok?0:1;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  main(process.argv[2]).then(c=>{process.exitCode=c},e=>{console.error('HATA: '+e.message);process.exitCode=1});
}
