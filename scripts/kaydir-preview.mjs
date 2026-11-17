// Statik önizleme + ölçüm + klavye akışı (PR K2: Kaydır Çöz): GERÇEK app/styles/*.css + GERÇEK bileşenlerin react-dom/server çıktısı (rapor-preview.mjs kalıbı; sınırlamalar aynı:
// Radix/shadcn düz karşılıklarla, tailwind derlenmez, Manrope yüklenmez). Klavye akışı için gerçek SwipeView + kancanın tarayıcı paketi çalıştırılır; ağ Playwright'ta taklit edilir.
// Fotoğraflar ÖRNEK bir SVG ile değiştirilir (gerçek soru fotoğrafı değildir). Veriler ÖRNEKTİR.
// Çalıştırma: ND_ROOT=<kök> OUT=<çıktı dizini> PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node scripts/kaydir-preview.mjs   (ONLY=<ekran adı parçası>, NOKEYS=1 klavye akışını atlar)
import fs from 'node:fs';import {createRequire} from 'node:module';
const NM='/opt/npm-tools/node_modules';const require=createRequire(NM+'/x.cjs');const {chromium}=require('playwright');const esbuild=require('esbuild');
const W=process.env.ND_ROOT+'/',OUT=process.env.OUT;fs.mkdirSync(OUT,{recursive:true});
const tmp=fs.mkdtempSync('/tmp/nd-kaydir-');const STUB=W+'scripts/preview/ui-stubs.tsx';
const common={bundle:true,jsx:'automatic',logLevel:'error',define:{'process.env.NODE_ENV':'"production"'},nodePaths:[NM],alias:{'@':W.replace(/\/$/,''),'sonner':STUB},
 plugins:[{name:'stubs',setup(b){b.onResolve({filter:/^@\/components\/ui\/(dialog|select|alert-dialog|table|sidebar|sonner|dropdown-menu|tabs)$/},()=>({path:STUB}));b.onResolve({filter:/^recharts$/},()=>({path:STUB}));b.onResolve({filter:/^react(-dom)?(\/.*)?$/},a=>({path:require.resolve(a.path,{paths:[NM]})}))}}]};
await esbuild.build({...common,entryPoints:[W+'scripts/preview/kaydir-entry.tsx'],platform:'node',format:'cjs',outfile:tmp+'/ssr.cjs'});
await esbuild.build({...common,entryPoints:[W+'scripts/preview/kaydir-client.tsx'],platform:'browser',format:'iife',outfile:tmp+'/client.js'});
await esbuild.build({...common,entryPoints:[W+'scripts/preview/kaydir-chrome.ts'],platform:'browser',format:'iife',outfile:tmp+'/chrome.js'});
const chromeJs=fs.readFileSync(tmp+'/chrome.js','utf8');
const S=require(tmp+'/ssr.cjs');const clientJs=fs.readFileSync(tmp+'/client.js','utf8');
const css=fs.readdirSync(W+'app/styles').sort().map(f=>fs.readFileSync(W+'app/styles/'+f,'utf8')).join('').replace(/@import[^;]*;/g,'').replace(/@theme inline\{[^\n]*\n/,'');
const reset='*,::before,::after{box-sizing:border-box;border-width:0;border-style:solid}button,input,select,textarea{font:inherit;color:inherit;background-color:transparent;border-radius:0}button{cursor:pointer}ol,ul{list-style:none;margin:0;padding:0}h1,h2,h3,h4,p,dl,dd,figure{margin:0}a{color:inherit;text-decoration:inherit}img,svg{display:block}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}hr{border:0;border-top:1px solid #8884;margin:4px 0}';
const frame='.sb-frame{display:flex;min-height:100vh}.app-sidebar{width:16rem;flex:none;position:sticky;top:0;height:100vh;align-self:flex-start}.sb-inner{display:flex;flex-direction:column;height:100%}.sb-inset{flex:1;min-width:0;display:flex;flex-direction:column}@media(max-width:767px){.app-sidebar{display:none}}[data-slot=dropdown-menu-content]{display:block}[data-slot=dropdown-menu-content][hidden]{display:none}[data-slot=dropdown-menu-content]{position:absolute;z-index:5;right:0;background:var(--surface);min-width:176px;border:1px solid var(--line);border-radius:12px;padding:4px}[data-slot=dropdown-menu-item]{display:flex;align-items:center;gap:8px;padding:6px 8px}';
const calm='*{animation:none!important;transition:none!important}[data-rv]{opacity:1!important;transform:none!important}';
const wrap=(html,dark,extra='')=>`<!doctype html><html lang="tr" data-theme="${dark?'dark':'light'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${reset}</style><style>${css}</style><style>${frame}${calm}</style></head><body>${html}${extra}</body></html>`;
// ÖRNEK soru fotoğrafı (gerçek değil): sabit boyutlu SVG
const svg='<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420"><rect width="640" height="420" fill="#f3f3f3"/><text x="32" y="64" font-family="sans-serif" font-size="26" fill="#222">f(x) = x³ − 3x fonksiyonunun</text><text x="32" y="104" font-family="sans-serif" font-size="26" fill="#222">yerel minimum noktası hangisidir?</text><path d="M40 330 C160 80 260 80 320 220 S520 380 600 120" fill="none" stroke="#3454d1" stroke-width="4"/><text x="32" y="400" font-family="sans-serif" font-size="16" fill="#777">ÖRNEK GÖRSEL</text></svg>';
async function open(b,w,h,html,o={}){const p=await b.newPage({viewport:{width:w,height:h},reducedMotion:o.reduced?'reduce':'no-preference'});
 await p.route('http://nd.test/**',r=>{const u=new URL(r.request().url());if(/\/image$/.test(u.pathname))return r.fulfill({contentType:'image/svg+xml',body:svg});if(o.api&&r.request().method()!=='GET'&&u.pathname.startsWith('/api/'))return o.api(r);return r.fulfill({contentType:'text/html',body:html})});
 await p.goto('http://nd.test/');await p.waitForLoadState('load');return p}
const screens=[
 ['baslangic',()=>S.baslangic(),0,'start'],['bos',()=>S.bos(),0,'start'],
 ['soru-foto',()=>S.kart('q0'),0],['soru-metin',()=>S.kart('q1'),0],['soru-sikli-metin',()=>S.kart('q4'),0],
 ['cozum-kisa',()=>S.kart('q0'),1],['cozum-uzun',()=>S.kart('q1'),1],['cozumsuz',()=>S.kart('q2'),1],['cozum-yanlis-sik',()=>S.kart('q0',{pick:'D',mark:'bilemedim'}),1],['cozum-okunamadi',()=>S.kart('q3'),1],
 ['bitis',()=>S.bitis({hard:true,early:3}),6],
];
const sizes=[[320,640],[390,844],[768,1024],[1100,800],[1440,900]];const only=process.env.ONLY;
const measure=([kind])=>{const vis=e=>{const r=e.getBoundingClientRect(),cs=getComputedStyle(e);return r.width>0&&r.height>0&&cs.visibility!=='hidden'&&cs.display!=='none'&&!e.closest('[hidden]')};
 const cw=document.documentElement.clientWidth,mob=cw<768;const feed=document.querySelector('.sw-feed');const bar=document.querySelector('.mobile-bar'),top=document.querySelector('.topbar');
 const fr=feed?feed.getBoundingClientRect():null;const arts=[...document.querySelectorAll('.sw-feed>article')];
 const inView=fr?arts.filter(a=>{const r=a.getBoundingClientRect();return Math.min(r.bottom,fr.bottom)-Math.max(r.top,fr.top)>fr.height*.5}):[];
 const card=inView[0]||document.querySelector('.view');const scope=[...card.querySelectorAll('button,a,[role=tab]')].filter(vis);
 const th=mob?50:46;
 const kirik=scope.filter(e=>!e.classList.contains('sw-photo')&&(e.getBoundingClientRect().height>th||(()=>{const g=document.createRange();g.selectNodeContents(e);return new Set([...g.getClientRects()].map(x=>Math.round(x.top/4))).size>2})())).map(e=>(e.textContent||e.getAttribute('aria-label')||'').trim().slice(0,24));
 const small=scope.filter(e=>!e.classList.contains('sw-photo')&&e.getBoundingClientRect().height<(e.matches('.sw-opt,.sw-bar button,.sw-foot button')&&mob?47.5:43.5)).map(e=>(e.getAttribute('aria-label')||e.textContent||e.className).trim().slice(0,24));
 const clip=scope.filter(e=>e.scrollWidth>e.clientWidth+1).map(e=>(e.textContent||'').trim().slice(0,24));
 const prim=[...card.querySelectorAll('.primary')].filter(vis).length;
 const barTop=bar&&vis(bar)?bar.getBoundingClientRect().top:innerHeight,topBot=top?top.getBoundingClientRect().bottom:0;
 const sb=card.querySelector('.scroll-body');
 return {tasma:document.documentElement.scrollWidth>cw,sayfaKayar:document.documentElement.scrollHeight>innerHeight+1,
  kartSayisi:kind==='start'?null:inView.length,kartOturuyor:kind==='start'||(inView.length===1&&Math.abs(inView[0].getBoundingClientRect().top-fr.top)<=2&&Math.abs(inView[0].getBoundingClientRect().height-fr.height)<=2),
  goruntuAlani:fr?{ust:Math.round(fr.top-topBot),alt:Math.round(barTop-fr.bottom),yuk:Math.round(fr.height)}:null,
  kirikDugme:kirik,kucukHedef:small,kirpilan:clip,birincil:prim,icKayar:sb?sb.scrollHeight>sb.clientHeight+1:false};};
const fake=(writes=[])=>r=>{const rq=r.request();const body=rq.postDataJSON?.()||{};writes.push({m:rq.method(),url:new URL(rq.url()).pathname,body});const id=new URL(rq.url()).pathname.split('/')[3];const q=JSON.parse(JSON.stringify(S.sampleRows)).find(x=>x.id===id);return r.fulfill({contentType:'application/json',body:JSON.stringify({question:{...q,review_stage:(q.review_stage||0)+1,next_review:'2099-01-01'}})})};
const b=await chromium.launch();const meas={};let bad=0;
for(const [name,mk,idx,kind] of screens){if(only&&!name.includes(only))continue;const html=mk();
 for(const [w,h] of sizes)for(const dark of [false,true]){
  const p=await open(b,w,h,wrap(html,dark));await p.addScriptTag({content:chromeJs});await p.evaluate(()=>window.__watchChrome());await p.waitForTimeout(60);
  await p.evaluate(i=>{const f=document.querySelector('.sw-feed');if(f)f.scrollTo({top:i*f.clientHeight,behavior:'instant'})},idx);await p.waitForTimeout(60);
  const key=`${name}-${w}-${dark?'koyu':'acik'}`;const m=await p.evaluate(measure,[kind||'feed']);meas[key]=m;
  const fail=m.tasma||!m.kartOturuyor||m.kirikDugme.length||m.kucukHedef.length||m.kirpilan.length||m.birincil>1||(m.goruntuAlani&&(m.goruntuAlani.ust<-1||m.goruntuAlani.alt<-1))||m.sayfaKayar&&kind!=='start';
  if(fail){bad++;console.log('SORUN',key,JSON.stringify(m))}
  await p.screenshot({path:`${OUT}/${key}.png`,fullPage:true});await p.close()}}
fs.writeFileSync(OUT+'/olcum.json',JSON.stringify(meas,null,1));console.log('ölçüm: ekran sayısı',Object.keys(meas).length,'sorunlu',bad);
// ---- Klavye akışı (gerçek kanca, taklit ağ) ----
if(!process.env.NOKEYS){
 const rows=JSON.parse(JSON.stringify(S.sampleRows));const html=wrap('<main class="workspace"><div class="view" data-view="swipe" data-width="wide" id="root"></div></main>',false,`<script>${clientJs.replace(/<\/script>/g,'<\\/script>')}</script><script>window.__mount(${JSON.stringify(rows)})</script>`);
 const res={};
 for(const [label,w,h,reduced] of [['kisayol-390-azaltilmis',390,844,true],['kisayol-1100-azaltilmis',1100,800,true],['otomatik-gecis-390',390,844,false]]){
  const writes=[];const p=await open(b,w,h,html,{reduced,api:fake(writes)});
  const log=[];const st=async n=>{const o=await p.evaluate(()=>{const f=document.querySelector('.sw-feed');const a=document.activeElement;return f?{idx:Math.round(f.scrollTop/f.clientHeight),odak:a&&a.id||a?.tagName,canli:document.querySelector('[aria-live]')?.textContent,bitis:!!document.querySelector('.sw-end'),slots:f.querySelectorAll('[data-idx]').length}:{feed:false}});log.push({adim:n,...o});return o};
  await p.getByRole('button',{name:'Başla'}).click();await p.waitForSelector('.sw-feed');await p.waitForTimeout(150);await st('başla');
  await p.keyboard.press('ArrowDown');await p.waitForTimeout(700);await st('↓ (çözüm kartı)');
  await p.keyboard.press('1');await p.waitForTimeout(reduced?150:900);await st(reduced?'1 (Bildim)':'1 (Bildim, 400ms sonra otomatik geçiş)');
  if(reduced){await p.keyboard.press('ArrowDown');await p.waitForTimeout(700);await st('↓ (sonraki soru)');
   // kalan sorular: ↓, 1, ↓ ... bitiş kartına kadar
   for(let i=0;i<12&&!(await p.evaluate(()=>!!document.querySelector('.sw-end')));i++){await p.keyboard.press('ArrowDown');await p.waitForTimeout(450);await p.keyboard.press('1');await p.waitForTimeout(100);await p.keyboard.press('ArrowDown');await p.waitForTimeout(450)}
   await p.waitForTimeout(900);const o=await st('oturum sonu');
   if(o.bitis){await p.screenshot({path:`${OUT}/klavye-${label}-bitis.png`})}
   // Esc → başlangıç + devam
   await p.keyboard.press('Escape');await p.waitForTimeout(200);log.push({adim:'Esc → başlangıç',metin:(await p.locator('.sw-start').innerText().catch(()=>'yok')).slice(0,80)});
  }
  res[label]={log,yazmalar:writes.map(x=>x.m+' '+x.url.split('/').slice(-1)[0]+' '+JSON.stringify(x.body))};await p.close()}
 // Tekerlek: tek kart (scroll-snap mandatory; farklı delta değerleriyle) + yarım oturumdan devam
 res.tekerlek={};for(const d of [100,300,600]){const p=await open(b,390,844,html,{reduced:false,api:fake()});await p.getByRole('button',{name:'Başla'}).click();await p.waitForSelector('.sw-feed');await p.waitForTimeout(200);
   const box=await p.locator('.sw-feed').boundingBox();await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.mouse.wheel(0,d);await p.waitForTimeout(900);
   res.tekerlek['delta'+d]=await p.evaluate(()=>{const f=document.querySelector('.sw-feed');return Math.round(f.scrollTop/f.clientHeight*100)/100});await p.close()}
 { const p=await open(b,390,844,html,{reduced:true,api:fake()});await p.getByRole('button',{name:'Başla'}).click();await p.waitForSelector('.sw-feed');await p.keyboard.press('ArrowDown');await p.waitForTimeout(500);await p.keyboard.press('2');await p.keyboard.press('ArrowDown');await p.waitForTimeout(700);
   await p.keyboard.press('Escape');await p.waitForTimeout(300);const t1=await p.locator('.sw-actions').innerText();await p.getByRole('button',{name:/Kaldığın yerden devam et/}).click();await p.waitForTimeout(400);
   res.devam={baslangicEkrani:t1.replace(/\n/g,' | '),devamSonrasi:await p.evaluate(()=>({idx:Math.round(document.querySelector('.sw-feed').scrollTop/document.querySelector('.sw-feed').clientHeight),odak:document.activeElement?.id,canli:document.querySelector('[aria-live]').textContent}))};await p.close()}
 fs.writeFileSync(OUT+'/klavye.json',JSON.stringify(res,null,1));console.log(JSON.stringify(res).slice(0,1800));
}
await b.close();fs.rmSync(tmp,{recursive:true,force:true});
