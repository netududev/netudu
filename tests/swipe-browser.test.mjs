// Kaydır Çöz kancası + akış: gerçek SwipeView/kanca tarayıcıda (Playwright, taklit ağ). Veriler ÖRNEKTİR.
// esbuild/playwright/tarayıcı bulunamazsa test BAŞARISIZ olur (sessiz atlama yok). Aranan yollar: NODE_PATH, /opt/npm-tools/node_modules, <kök>/node_modules ve üst dizinler.
import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtempSync,rmSync,readFileSync,readdirSync,existsSync} from 'node:fs';
import {join,dirname,delimiter,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=join(dirname(fileURLToPath(import.meta.url)),'..');
if(!process.env.PLAYWRIGHT_BROWSERS_PATH&&existsSync('/opt/pw-browsers'))process.env.PLAYWRIGHT_BROWSERS_PATH='/opt/pw-browsers';
const up=[];for(let d=resolve(root);;d=dirname(d)){up.push(join(d,'node_modules'));if(dirname(d)===d)break}
const dirs=[...new Set([...(process.env.NODE_PATH||'').split(delimiter).filter(Boolean),'/opt/npm-tools/node_modules',...up])];
let NM=null,esbuild=null,chromium=null;
for(const d of dirs){try{const r=createRequire(join(d,'x.cjs'));esbuild=r('esbuild');chromium=r('playwright').chromium;r.resolve('react-dom/client');NM=d;break}catch{}}
let tmp=null,clientJs='',css='',browser=null;
const reset='*,::before,::after{box-sizing:border-box;border-width:0;border-style:solid}button,input,select,textarea{font:inherit;color:inherit;background-color:transparent;border-radius:0}button{cursor:pointer}ol,ul{list-style:none;margin:0;padding:0}h1,h2,h3,h4,p,dl,dd,figure{margin:0}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}';
const calm='*{animation:none!important;transition:none!important}';
const svg='<svg xmlns="http://www.w3.org/2000/svg" width="64" height="42"><rect width="64" height="42" fill="#eee"/></svg>';
const DAY_OLD='2026-01-05',DAY_OLD2='2026-01-04';

before(async()=>{
  assert.ok(NM&&esbuild&&chromium,'esbuild/playwright/react-dom bulunamadı; aranan yollar: '+dirs.join(', '));
  const require=createRequire(join(NM,'x.cjs'));tmp=mkdtempSync('/tmp/nd-kaydir-br-');const stub=join(root,'scripts/preview/ui-stubs.tsx');
  await esbuild.build({entryPoints:[join(root,'scripts/preview/kaydir-client.tsx')],bundle:true,platform:'browser',format:'iife',outfile:tmp+'/client.js',jsx:'automatic',logLevel:'silent',define:{'process.env.NODE_ENV':'"production"'},nodePaths:[NM],
    alias:{'@':root,'sonner':stub},plugins:[{name:'s',setup(b){b.onResolve({filter:/^@\/components\/ui\/(dialog|select|alert-dialog|table|sidebar|sonner|dropdown-menu|tabs)$/},()=>({path:stub}));b.onResolve({filter:/^recharts$/},()=>({path:stub}));b.onResolve({filter:/^react(-dom)?(\/.*)?$/},a=>({path:require.resolve(a.path,{paths:[NM]})}))}}]});
  clientJs=readFileSync(tmp+'/client.js','utf8');
  css=readdirSync(join(root,'app/styles')).sort().map(f=>readFileSync(join(root,'app/styles',f),'utf8')).join('').replace(/@import[^;]*;/g,'').replace(/@theme inline\{[^\n]*\n/,'');
  browser=await chromium.launch();
});
after(async()=>{if(browser)await browser.close();if(tmp)rmSync(tmp,{recursive:true,force:true})});

// Sayfa: gerçek CSS + gerçek paket; modes: kimlik → 'ok'|'500'|'abort' (varsayılan ok); writes: PATCH kayıtları
async function page(o={}){
  const ctx=await browser.newContext({viewport:{width:o.w??390,height:o.h??844},reducedMotion:o.motion?'no-preference':'reduce'});const p=await ctx.newPage();
  const modes=o.modes??{};const writes=[];let ROWS=[];
  const chrome=o.chrome?'<header class="topbar" style="height:70px">üst</header><nav class="mobile-bar" id="bar" style="height:80px">alt</nav>':'';
  const html=`<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${reset}</style><style>${css}</style><style>${calm}</style></head><body>${chrome}<main class="workspace"><div class="view" data-view="swipe" data-width="wide" id="root"></div></main><script>${clientJs.replace(/<\/script>/g,'<\\/script>')}</script></body></html>`;
  await p.route('http://nd.test/**',async r=>{const u=new URL(r.request().url()),m=r.request().method();
    if(/\/image$/.test(u.pathname))return r.fulfill({contentType:'image/svg+xml',body:svg});
    if(m==='PATCH'&&u.pathname.startsWith('/api/')){const id=u.pathname.split('/')[3];const body=r.request().postDataJSON();writes.push({id,body});const mode=typeof modes[id]==='function'?modes[id]():(modes[id]??'ok');
      if(mode==='slow500'){await new Promise(f=>setTimeout(f,1500));return r.fulfill({status:500,contentType:'application/json',body:'{"error":"x"}'})}
      if(mode==='slow')await new Promise(f=>setTimeout(f,800));
      if(mode==='abort')return r.abort();if(mode==='500')return r.fulfill({status:500,contentType:'application/json',body:'{"error":"x"}'});
      if(mode==='same')return r.fulfill({contentType:'application/json',body:JSON.stringify({question:ROWS.find(q=>q.id===id)})});
      return r.fulfill({contentType:'application/json',body:JSON.stringify({question:{...ROWS.find(q=>q.id===id),review_stage:2,next_review:'2099-01-01'}})})}
    return r.fulfill({contentType:'text/html',body:html})});
  if(o.local)await p.addInitScript(l=>{if(!sessionStorage.getItem('seeded')){for(const [k,v] of Object.entries(l))localStorage.setItem(k,v);sessionStorage.setItem('seeded','1')}},o.local);
  await p.goto('http://nd.test/');ROWS=await p.evaluate(()=>window.__sample);await p.evaluate(r=>window.__mount(r),o.rows?o.rows(ROWS):ROWS);
  return {p,ctx,writes,modes};
}

const press=async(p,k,ms=120)=>{await p.keyboard.press(k);await p.waitForTimeout(ms)};
const today=p=>p.evaluate(()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`});
const sessionOf=async p=>{const d=await today(p);return p.evaluate(k=>JSON.parse(localStorage.getItem(k)||'null'),`kaydir:u1:${d}`)};
const hide=(p,state='hidden')=>p.evaluate(s=>{Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>s});document.dispatchEvent(new Event('visibilitychange'))},state);
const pagehide=p=>p.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
// Başla → ilk kartın çözümü → işaret
const startMark=async(p,k)=>{await p.getByRole('button',{name:'Başla'}).click();await p.waitForSelector('.sw-feed');await p.waitForTimeout(200);await press(p,'ArrowDown',500);await press(p,k,150)};

test('1: işaretli güncel kart, gizle x2 + pagehide ile TEK kez gönderilir',async()=>{
  const {p,writes,ctx}=await page();await startMark(p,'1');
  await hide(p);await hide(p,'visible');await hide(p);await pagehide(p);await p.waitForTimeout(400);
  assert.equal(writes.length,1,JSON.stringify(writes));assert.equal(writes[0].body.review,'doğru');await ctx.close();
});
test('1b: yeni oturumda aynı soru için sonuç yazması düşmez (hideSent oturumla sıfırlanır)',async()=>{
  const {p,writes,ctx}=await page({rows:r=>r.filter(q=>q.id==='q0'),modes:{q0:'same'}});await startMark(p,'2');await hide(p);await p.waitForTimeout(300);
  assert.equal(writes.length,1,'ilk oturumda bilemedim gizlemede gider');
  await press(p,'Escape',300);await p.getByRole('button',{name:'Baştan başla'}).click();await p.waitForSelector('.sw-feed');await p.waitForTimeout(200);
  await press(p,'ArrowDown',500);await press(p,'2',150);await press(p,'ArrowDown',700);await p.waitForTimeout(400);
  assert.equal(writes.filter(w=>w.id===writes[0].id).length,2,'yeni oturumda aynı soru yeniden yazılır: '+JSON.stringify(writes));await ctx.close();
});
test('2a: çevrimdışıyken gizleme göndermez ve bekleyeni silmez; bağlantı gelince gider',async()=>{
  const {p,writes,ctx,modes}=await page({modes:{}});
  const fail=()=>'500';const all=['q0','q1','q2','q3','q4','q5','q6'];for(const id of all)modes[id]=fail;
  await p.getByRole('button',{name:'Başla'}).click();await p.waitForSelector('.sw-feed');await p.waitForTimeout(200);await press(p,'ArrowDown',500);await press(p,'2',150);await press(p,'ArrowDown',600);await p.waitForTimeout(500);
  let s=await sessionOf(p);assert.equal(s.pending.length,1,'başarısız yazma pending: '+JSON.stringify(s.pending));const id=s.pending[0].id;
  await ctx.setOffline(true);const before=writes.length;await hide(p);await pagehide(p);await p.waitForTimeout(300);
  s=await sessionOf(p);assert.deepEqual(s.pending.map(x=>x.id),[id],'çevrimdışıyken pending silinmedi');
  for(const k of all)delete modes[k];await ctx.setOffline(false);await p.waitForTimeout(600);
  assert.ok(writes.slice(before).some(w=>w.id===id),'bağlantı gelince yeniden gönderildi');await ctx.close();
});
test('2b: keepalive başarısızsa kayıt pending\'de kalır; başarılıysa çıkar',async()=>{
  const {p,writes,ctx,modes}=await page();const all=['q0','q1','q2','q3','q4','q5','q6'];for(const id of all)modes[id]='500';
  await p.getByRole('button',{name:'Başla'}).click();await p.waitForSelector('.sw-feed');await p.waitForTimeout(200);await press(p,'ArrowDown',500);await press(p,'2',150);await press(p,'ArrowDown',600);await p.waitForTimeout(500);
  let s=await sessionOf(p);const id=s.pending[0].id;const t0=s.pending[0].tries;
  await hide(p);await p.waitForTimeout(500);s=await sessionOf(p);assert.deepEqual(s.pending.map(x=>x.id),[id],'keepalive başarısız: pending kaldı');assert.ok(s.pending[0].tries>t0,'tries arttı');
  for(const k of all)modes[k]='ok';await hide(p,'visible');await hide(p);await p.waitForTimeout(500);s=await sessionOf(p);assert.deepEqual(s.pending,[],'keepalive başarılı: pending çıktı');await ctx.close();
});
test('3: yeni oturumda Feed yeniden kurulur; ilk kart atlanmaz',async()=>{
  const {p,ctx}=await page();await p.getByRole('button',{name:'Başla'}).click();await p.waitForSelector('.sw-feed');await p.waitForTimeout(200);
  let guard=0;while(!(await p.$('.sw-end'))&&guard++<20){await press(p,'ArrowDown',450);await press(p,'2',100);await press(p,'ArrowDown',450)}
  await p.waitForSelector('.sw-end');await p.waitForTimeout(400);
  await p.getByRole('button',{name:'Bilemediklerini yeniden geç'}).click();await p.waitForTimeout(900);
  const s=await sessionOf(p);assert.equal(s.history.length,1,'yeni oturumda yalnız ilk kart: '+JSON.stringify(s.history));assert.equal(s.history[0],s.current);assert.ok(!Object.values(s.results).some(r=>r.skips>0),'atlandı sayılmadı: '+JSON.stringify(s.results));
  assert.ok(!(await p.$('.sw-end')),'bitiş kartı değil, soru kartı');await ctx.close();
});
test('4+9: eski günlerin kısmi başarısızlığı: yalnız başarısızlar kalır, tries artar; tries>=3 de toplanır',async()=>{
  const old=(day,pending)=>JSON.stringify({day,subject:'Tüm dersler',scope:'due',includeLearned:false,queue:[],current:null,history:[],mark:null,results:{},struggle:[],pending,tiers:{}});
  const local={[`kaydir:u1:${DAY_OLD}`]:old(DAY_OLD,[{id:'q0',review:'doğru',tries:0},{id:'q1',review:'yanlış',tries:1},{id:'q2',review:'yanlış',tries:3}]),[`kaydir:u1:${DAY_OLD2}`]:old(DAY_OLD2,[{id:'q4',review:'doğru',tries:0}])};
  const {p,writes,ctx}=await page({local,modes:{q1:'500'}});await p.waitForTimeout(1200);
  assert.deepEqual(writes.map(w=>w.id).sort(),['q0','q1','q2','q4'],'tries>=3 dahil hepsi denendi');
  const st=await p.evaluate(()=>Object.fromEntries(Object.keys(localStorage).filter(k=>k.startsWith('kaydir:u1:')).map(k=>[k,JSON.parse(localStorage[k]).pending])));
  assert.deepEqual(st[`kaydir:u1:${DAY_OLD}`],[{id:'q1',review:'yanlış',tries:2}],'yalnız başarısız kaldı, tries arttı');assert.ok(!(`kaydir:u1:${DAY_OLD2}` in st),'tamamen gönderilen anahtar silindi');
  await ctx.close();
});
test('10: kart içi kaydırma en alttayken ↓ ve Boşluk sonraki karta geçer; ortadayken içte kaydırır',async()=>{
  for(const key of ['ArrowDown',' ']){
    const {p,ctx}=await page({h:600,rows:r=>r.filter(q=>q.id==='q1')});
    await p.getByRole('button',{name:'Başla'}).click();await p.waitForSelector('.sw-feed');await p.waitForTimeout(200);await press(p,'ArrowDown',600);
    const idx=()=>p.evaluate(()=>{const f=document.querySelector('.sw-feed');return Math.round(f.scrollTop/f.clientHeight)});
    assert.equal(await idx(),1);
    const info=await p.evaluate(()=>{const sb=document.querySelector('.sw-feed>article:nth-child(2) .scroll-body');sb.focus();sb.scrollTop=0;return {over:sb.scrollHeight>sb.clientHeight+1}});assert.ok(info.over,'çözüm içi taşıyor');
    await press(p,key,500);assert.equal(await idx(),1,key+': ortadayken kart değişmedi');
    await p.evaluate(()=>{const sb=document.querySelector('.sw-feed>article:nth-child(2) .scroll-body');sb.scrollTop=sb.scrollHeight;sb.focus()});await p.waitForTimeout(100);
    await press(p,key,800);assert.equal(await idx(),2,key+': en alttayken sonraki karta geçti');await ctx.close();
  }
});
test('7: devamda açılış konumlanması anında olur (scroll-behavior:smooth kalıbına rağmen)',async()=>{
  const {p,ctx}=await page({h:700,motion:true});await p.getByRole('button',{name:'Başla'}).click();await p.waitForSelector('.sw-feed');await p.waitForTimeout(200);
  await press(p,'ArrowDown',900);await press(p,'2',150);await press(p,'ArrowDown',1200);await press(p,'Escape',500);
  const r=await p.evaluate(async()=>{[...document.querySelectorAll('button')].find(b=>/Kaldığın yerden devam et/.test(b.textContent)).click();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const f=document.querySelector('.sw-feed');return {top:f.scrollTop,ch:f.clientHeight}});
  assert.ok(r.top>0&&r.top%r.ch===0,'iki kare sonra konum hedefte (yumuşak kaydırma ortada kalırdı): '+JSON.stringify(r));await ctx.close();
});
test('5: üst çubuk ve mobil alt çubuk yüksekliği ölçülüp --sw-top/--sw-bar olur; boyut değişince izlenir',async()=>{
  const {p,ctx}=await page({chrome:true,w:320});await p.waitForTimeout(300);
  const v=()=>p.evaluate(()=>{const w=document.querySelector('.workspace');const c=getComputedStyle(w);return [c.getPropertyValue('--sw-top').trim(),c.getPropertyValue('--sw-bar').trim()]});
  assert.deepEqual(await v(),['70px','80px']);
  await p.evaluate(()=>{document.getElementById('bar').style.height='96px'});await p.waitForTimeout(300);assert.deepEqual(await v(),['70px','96px']);
  await ctx.close();
});

const live=p=>p.evaluate(()=>document.querySelector('.sr-only[role=status]')?.textContent||'');
test('11: gizlemede gönderilen güncel kart yavaş başarısız olur, kart terk edilir: sonuç kaybolmaz, sonraki geçişte yeniden gider',async()=>{
  const {p,writes,ctx,modes}=await page();await p.getByRole('button',{name:'Başla'}).click();await p.waitForSelector('.sw-feed');await p.waitForTimeout(200);await press(p,'ArrowDown',500);await press(p,'1',150);
  const id=(await sessionOf(p)).current;modes[id]='slow500';
  await hide(p);await hide(p,'visible');await press(p,'ArrowDown',600);
  let s=await sessionOf(p);assert.deepEqual(s.pending,[],'gizleme gönderdi, terk: pending boş');
  await p.waitForTimeout(1800);s=await sessionOf(p);assert.deepEqual(s.pending.map(x=>x.id),[id],'yavaş başarısızlık: terk edilmiş kart bekleyene girer: '+JSON.stringify(s.pending));
  const w0=writes.filter(w=>w.id===id).length;
  await press(p,'ArrowDown',500);await press(p,'1',150);await press(p,'ArrowDown',600);
  assert.ok(writes.filter(w=>w.id===id).length>w0,'sonraki geçişte yeniden gönderildi: '+JSON.stringify(writes));
  s=await sessionOf(p);assert.ok(s.pending.some(x=>x.id===id),'kayıt silinmedi');await ctx.close();
});
test('12: Esc işaretlenmemiş kartı atlamaz; devam aynı karttan sürer, skips 0, sayaç şişmez',async()=>{
  const {p,ctx}=await page();await p.getByRole('button',{name:'Başla'}).click();await p.waitForSelector('.sw-feed');await p.waitForTimeout(200);
  await press(p,'Escape',300);let s=await sessionOf(p);const id=s.current,total=s.queue.length+1;
  assert.ok(id,'güncel kart korunur');assert.ok(!Object.values(s.results).some(r=>r.skips>0),'atlandı sayılmadı: '+JSON.stringify(s.results));
  const btn=p.getByRole('button',{name:/Kaldığın yerden devam et/});assert.equal((await btn.textContent()).replace(/\s/g,''),`Kaldığınyerdendevamet(1/${total})`);
  await btn.click();await p.waitForSelector('.sw-feed');await p.waitForTimeout(300);s=await sessionOf(p);assert.equal(s.current,id,'aynı kart');assert.equal(s.history.length,1);
  await press(p,'Escape',300);await p.getByRole('button',{name:/Kaldığın yerden devam et/}).click();await p.waitForTimeout(300);s=await sessionOf(p);
  assert.equal(s.current,id);assert.ok(!Object.values(s.results).some(r=>r.skips>0),'ikinci çıkışta da atlama yok');await ctx.close();
});
test('12b: Esc işaretli kartı işler ve sonraki karta geçer',async()=>{
  const {p,ctx}=await page();await startMark(p,'1');await press(p,'Escape',300);const s=await sessionOf(p);
  assert.equal(Object.values(s.results).filter(r=>r.first==='bildim').length,1);assert.equal(s.history.length,2,'sonraki kart güncel');assert.equal(s.current,s.history[1]);await ctx.close();
});
test('13: son kartta bitiş kartına odak taşınır ve "Oturum bitti." duyurulur',async()=>{
  const {p,ctx}=await page({rows:r=>r.filter(q=>q.id==='q1')});await startMark(p,'1');await press(p,'ArrowDown',900);await p.waitForSelector('.sw-end');await p.waitForTimeout(300);
  assert.equal(await p.evaluate(()=>document.activeElement?.id),'sw-end-h');assert.equal(await live(p),'Oturum bitti.');await ctx.close();
});
test('14: devamda eski oturumun duyurusu görünmez',async()=>{
  const {p,ctx}=await page();await startMark(p,'2');await press(p,'Escape',300);await p.getByRole('button',{name:/Kaldığın yerden devam et/}).click();await p.waitForTimeout(400);
  const t=await live(p);assert.ok(!/Bilemedim\./.test(t),'eski duyuru yok: '+t);await ctx.close();
});
test('15: görünümden çıkıp dönünce eski gün kayıtları ikinci kez gönderilmez',async()=>{
  const old=JSON.stringify({day:DAY_OLD,subject:'Tüm dersler',scope:'due',includeLearned:false,queue:[],current:null,history:[],mark:null,results:{},struggle:[],pending:[{id:'q0',review:'doğru',tries:0}],tiers:{}});
  const {p,writes,ctx}=await page({local:{[`kaydir:u1:${DAY_OLD}`]:old},modes:{q0:'slow'}});
  await p.waitForTimeout(150);await p.evaluate(()=>window.__unmount());await p.evaluate(()=>window.__mount());await p.waitForTimeout(1500);
  assert.equal(writes.filter(w=>w.id==='q0').length,1,JSON.stringify(writes));await ctx.close();
});
test('16: gizlemede gönderilen sonuç sonradan değiştirilirse bildirim ilk sonucun geçerli kaldığını söyler',async()=>{
  const {p,ctx}=await page();await startMark(p,'1');await hide(p);await p.waitForTimeout(300);await press(p,'2',200);
  assert.match(await live(p),/ilk sonucun/);assert.match(await p.textContent('.sw-result'),/ilk sonucun/,'görünür not da');await ctx.close();
});
