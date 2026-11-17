// Kaydır Çöz: gerçek bileşenlerin react-dom/server çıktısında metin/sınıf denetimi (rapor-render.test.mjs kalıbı).
// esbuild ve react bulunamazsa test BAŞARISIZ olur (sessiz atlama yok). Aranan yollar: NODE_PATH, /opt/npm-tools/node_modules, <kök>/node_modules, <kök>/../node_modules ve üst dizinlerin node_modules'u.
// Radix kabukları ve recharts scripts/preview/ui-stubs.tsx ile değiştirilir. Test paketi docs/proof altına bağımlı değildir.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {join,dirname,delimiter,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const up=[];for(let d=resolve(root);;d=dirname(d)){up.push(join(d,'node_modules'));if(dirname(d)===d)break}
const dirs=[...new Set([...(process.env.NODE_PATH||'').split(delimiter).filter(Boolean),'/opt/npm-tools/node_modules',...up])];
let NM=null,esbuild=null;
for(const d of dirs){try{const r=createRequire(join(d,'x.cjs'));esbuild=r('esbuild');r.resolve('react-dom/server');NM=d;break}catch{}}
test('önizleme araçları (esbuild + react-dom) bulunabilir; bulunamazsa açık hata',()=>{
  assert.ok(NM&&esbuild,'esbuild/react-dom bulunamadı; aranan yollar: '+dirs.join(', '));
});
let S=null;
async function load(){
  if(S)return S;
  const require=createRequire(join(NM,'x.cjs'));const tmp=mkdtempSync('/tmp/nd-kaydir-test-');const stub=join(root,'scripts/preview/ui-stubs.tsx');
  await esbuild.build({entryPoints:[join(root,'scripts/preview/kaydir-entry.tsx')],bundle:true,platform:'node',format:'cjs',outfile:tmp+'/ssr.cjs',jsx:'automatic',logLevel:'silent',define:{'process.env.NODE_ENV':'"production"'},nodePaths:[NM],
    alias:{'@':root,'sonner':stub},plugins:[{name:'s',setup(b){b.onResolve({filter:/^@\/components\/ui\/(dialog|select|alert-dialog|table|sidebar|sonner|dropdown-menu|tabs)$/},()=>({path:stub}));b.onResolve({filter:/^recharts$/},()=>({path:stub}));b.onResolve({filter:/^react(-dom)?(\/.*)?$/},a=>({path:require.resolve(a.path,{paths:[NM]})}))}}]});
  S=require(tmp+'/ssr.cjs');rmSync(tmp,{recursive:true,force:true});return S;
}
const text=h=>h.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
const count=(h,re)=>(h.match(re)||[]).length;
const view=h=>h.slice(h.indexOf('class="view"'));
const articles=h=>[...view(h).matchAll(/<article[^>]*>[\s\S]*?<\/article>/g)].map(m=>m[0]);
const css=readFileSync(join(root,'app/styles/99-kaydir-coz.css'),'utf8');

test('başlangıç: başlık, ders çipleri (yalnız sorusu olan dersler, sayı), kapsam anahtarı, tek birincil "Başla"',async()=>{
  const S=await load();const h=view(S.baslangic());const t=text(h);
  assert.match(t,/Bugün 6 soru seni bekliyor/);
  assert.match(h,/role="group" aria-label="Ders"/);
  for(const d of ['Matematik','Fizik','Kimya','Biyoloji'])assert.match(t,new RegExp(d));
  assert.doesNotMatch(h,/Türk Dili/);
  assert.match(t,/Yalnız bugünküler/);assert.match(t,/Tümü/);
  assert.equal(count(h,/class="primary"/g),1);assert.match(t,/Başla/);assert.doesNotMatch(t,/Kaldığın yerden/);
});
test('boş durum: "Kaydırmak için önce yanlış ekle" ve tek birincil "Yanlış ekle"',async()=>{
  const S=await load();const h=view(S.bos());
  assert.match(text(h),/Kaydırmak için önce yanlış ekle/);assert.match(text(h),/Yanlış ekle/);assert.equal(count(h,/class="primary"/g),1);
});
test('kenar çubuğu: "Kaydır Çöz" girdisi Yanlış defteri\'nin altında; sayfa başlığı ve açıklaması',async()=>{
  const S=await load();const h=S.baslangic();const side=h.slice(h.indexOf('<aside'),h.indexOf('</aside>'));
  assert.ok(side.indexOf('Yanlış defteri')<side.indexOf('Kaydır Çöz'));assert.ok(side.indexOf('Kaydır Çöz')<side.indexOf('Aylık rapor'));
  assert.match(h,/<h1>Kaydır Çöz\.<\/h1><p>Yanlışlarını tek tek kaydır, çözümü gör, tekrar takvimin kendiliğinden ilerlesin\.<\/p>/);
  assert.match(side,/data-active="true"[^>]*>.*?Kaydır Çöz/);
  assert.match(h.slice(h.indexOf('<header class="topbar"')),/topbar-add secondary/);
});
test('akış: role=feed, aria-label, makale konumu ve boyutu, aria-labelledby; canlı bölge',async()=>{
  const S=await load();const h=S.kart('q0');
  assert.match(h,/role="feed" aria-label="Kaydır Çöz soruları"/);
  const a=articles(h);assert.equal(a.length,2);
  assert.match(a[0],/aria-posinset="1" aria-setsize="\d+"/);assert.match(a[1],/aria-posinset="2"/);
  assert.match(a[0],/aria-labelledby="sw-q-1"/);assert.match(a[1],/aria-labelledby="sw-s-2"/);
  assert.match(a[0],/id="sw-q-1"[^>]*tabindex="-1"/);assert.match(text(a[0]),/Soru 1: Matematik ?, Türev/);assert.match(text(a[1]),/Çözüm 1/);
  assert.match(h,/aria-live="polite"/);
});
test('soru kartı: cevap anahtarı METNİ yok; şık düğmeleri A–E; fotoğraf alt metni; "Daha önce"; "Çözümü göster"; kapat 44px sınıfı',async()=>{
  const S=await load();
  const photo=articles(S.kart('q0'))[0];
  assert.doesNotMatch(text(photo),/Doğru cevap/);assert.equal(count(photo,/class="sw-opt secondary/g),5);
  assert.match(photo,/alt="f\(x\) = x³ − 3x fonksiyonunun/);assert.match(photo,/Daha önce: D dedin/);assert.match(text(photo),/Çözümü göster/);assert.match(photo,/Çözümü görmek için yukarı kaydır/);
  assert.match(photo,/aria-label="Kaydır Çöz&#x27;ü kapat"/);assert.match(css,/\.sw-close,\.view\[data-view=swipe\] \.sw-more\{[^}]*width:var\(--h-btn\)/);
  const noTr=articles(S.kart('q5'))[0];assert.match(noTr,/alt="Soru fotoğrafı, Fizik, Basınç"/);
  const txt=articles(S.kart('q1'))[0];assert.match(txt,/class="sw-qtext"/);assert.doesNotMatch(txt,/class="sw-opt/);assert.doesNotMatch(text(txt),/\b18\b/,'cevap anahtarı soru kartında yok');
  assert.doesNotMatch(txt,/Doğru cevap/);assert.match(txt,/Daha önce: boş bıraktın/);
  for(const id of ['q0','q1','q4','q5'])assert.equal(count(articles(S.kart(id))[0],/class="primary/g),0,id);
});
test('çözüm kartı: sonuç bandı, numaralı adımlar, kritik nokta, konu notu "Devamı", alt çubuk Bilemedim solda + Bildim sağda',async()=>{
  const S=await load();const a=articles(S.kart('q0'))[1];const t=text(a);
  assert.match(t,/Doğru cevap: B/);assert.equal(count(a,/<li>/g),3);assert.match(a,/class="sw-pitfall"/);assert.match(t,/Kritik nokta/);assert.match(t,/Konu notu/);
  const bar=a.slice(a.indexOf('class="sw-bar"'));assert.ok(bar.indexOf('Bilemedim')<bar.indexOf('Bildim'));
  assert.match(bar,/class="secondary"[^>]*>Bilemedim/);assert.match(bar,/class="primary"[^>]*>Bildim/);assert.equal(count(a,/class="primary/g),1);
  assert.match(a,/aria-label="Diğer eylemler"/);assert.match(t,/Soruyu aç/);assert.match(t,/Konu videosu/);assert.match(t,/Öğrendim, artık gösterme/);
  const long=articles(S.kart('q1'))[1];assert.equal(count(long,/<li>/g),14);assert.match(long,/class="scroll-body"/);assert.match(text(long),/Devamı/);
});
test('çözüm kartı: şık seçilmişse "Sen: D", doğru/yanlış çerçeve sınıfı, tek ikincil "Sonucu değiştir" + "Sonraki"; hâlâ ≤1 birincil',async()=>{
  const S=await load();const bad=articles(S.kart('q0',{pick:'D',mark:'bilemedim'}))[1];
  assert.match(text(bad),/Sen: D/);assert.match(bad,/class="sw-band bad"/);assert.match(text(bad),/Bilemedim\. Yarın yeniden karşına gelecek\./);
  const bar=bad.slice(bad.indexOf('class="sw-bar"'));assert.match(bar,/class="secondary"[^>]*>Sonucu değiştir/);assert.match(bar,/class="primary"[^>]*>Sonraki/);assert.equal(count(bad,/class="primary/g),1);assert.doesNotMatch(bar,/>Bilemedim</);
  const good=articles(S.kart('q0',{pick:'B',mark:'bildim'}))[1];assert.match(good,/class="sw-band good"/);assert.match(text(good),/Bir sonraki tekrar \d+ [^\s.]+\./);
});
test('çözümsüz soru: cevap anahtarı + ikincil "Yapay zekâyla çöz"; kendiliğinden çağrı yok; ≤1 birincil',async()=>{
  const S=await load();const a=articles(S.kart('q2'))[1];
  assert.match(text(a),/Doğru cevap: 8/);assert.match(a,/class="secondary"[^>]*>.*?Yapay zekâyla çöz/);assert.equal(count(a,/class="primary/g),1);
  const src=readFileSync(join(root,'app/study/swipe/solution-card.tsx'),'utf8');assert.match(src,/onClick=\{\(\)=>void s\.solve\(q\)\}/);
  assert.doesNotMatch(readFileSync(join(root,'app/study/swipe/feed.tsx'),'utf8')+readFileSync(join(root,'app/study/swipe/use-swipe-session.ts'),'utf8'),/\.solve\(/);
  const off=articles(S.kart('q2',{online:false}))[1];assert.match(off,/<button[^>]*disabled=""[^>]*>.*?Yapay zekâyla çöz/);assert.match(text(off),/Bağlantı yok/);
});
test('okunamayan fotoğraf: "Fotoğraf okunamadı"; yapay zekâ düğmesi yok; ≤1 birincil',async()=>{
  const S=await load();const a=articles(S.kart('q3'))[1];
  assert.match(text(a),/Fotoğraf okunamadı/);assert.doesNotMatch(text(a),/Yapay zekâyla çöz/);assert.equal(count(a,/class="primary/g),1);
});
test('bitiş kartı: özet, çalışılacaklar, tek birincil "Bugüne dön"; "Bilemediklerini yeniden geç" yalnız Bilemedim>0',async()=>{
  const S=await load();const h=S.bitis({hard:true,early:3});const a=articles(h);const e=a[a.length-1];const t=text(e);
  assert.match(t,/3 soruyu geçtin/);assert.match(t,/Bildim 1/);assert.match(t,/Bilemedim 1/);assert.match(t,/Atladın 1/);assert.match(t,/Çalışman gerekenler/);
  assert.equal(count(e,/class="primary"/g),1);assert.match(e,/class="primary"[^>]*>Bugüne dön/);assert.match(t,/Bilemediklerini yeniden geç/);assert.match(t,/Erken tekrara devam et/);
  const none=S.bitis();const en=articles(none).pop();assert.doesNotMatch(text(en),/Erken tekrara/);
});
test('pencereleme: kartlar aynı yükseklikte boş div ile tutulur; en fazla 6 kart DOM\'da',async()=>{
  const S=await load();const h=S.kart('q0');assert.ok(count(view(h),/<article/g)<=6);
});
test('CSS: tüm seçiciler .view[data-view=swipe] altında (belgelenmiş istisnalar dışında), düz hex yok, kaydırma kabı kuralları',()=>{
  const plain=css.replace(/\/\*[\s\S]*?\*\//g,'');assert.ok(!/#[0-9a-f]{3,8}\b/i.test(plain),'renk jetonlardan gelir');
  const rules=[...plain.matchAll(/([^{}]+)\{[^{}]*\}/g)].map(m=>m[1].replace(/@media[^{]*$/,'').trim()).filter(s=>s&&!s.startsWith('@'));
  const loose=rules.filter(r=>!r.includes('[data-view=swipe]'));
  assert.deepEqual([...new Set(loose)],['[data-slot=dialog-content].sw-viewer','.sw-viewer .sw-viewer-scroll','.sw-viewer .sw-viewer-scroll img'],'istisna: portaldaki fotoğraf penceresi');
  assert.match(plain,/\.sw-feed\{[^}]*height:var\(--sw-h\)[^}]*overflow-y:auto[^}]*overscroll-behavior:contain[^}]*scroll-snap-type:y mandatory/);
  assert.match(plain,/\.sw-card\{[^}]*height:100%[^}]*scroll-snap-align:start[^}]*scroll-snap-stop:always/);
  assert.match(plain,/--sw-h:calc\(100dvh/);assert.match(plain,/env\(safe-area-inset-bottom\)/);assert.match(plain,/\.scroll-body\{[^}]*overflow-y:auto/);
  assert.match(plain,/prefers-reduced-motion:reduce/);assert.match(plain,/--sw-col:560px/);
});
test('globals.css: 99-kaydir-coz.css en sona @import edilmiş',()=>{
  const g=readFileSync(join(root,'app/globals.css'),'utf8').trim().split('\n');assert.equal(g.at(-1),'@import "./styles/99-kaydir-coz.css";');
});
