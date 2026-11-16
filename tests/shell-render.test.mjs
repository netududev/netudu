// Kabuk ve giriş sayfası: gerçek bileşenlerin react-dom/server çıktısında metin/sınıf denetimi.
// esbuild ve react bulunamazsa test BAŞARISIZ olur (sessiz atlama yok). Aranan yollar: NODE_PATH, /opt/npm-tools/node_modules, <kök>/node_modules, <kök>/../node_modules ve üst dizinlerin node_modules'u.
// Radix kabukları ve recharts scripts/preview/ui-stubs.tsx ile değiştirilir. Test paketi docs/proof altına bağımlı değildir.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtempSync,rmSync} from 'node:fs';
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
const skip=false;
let S=null;
async function load(){
  if(S)return S;
  const require=createRequire(join(NM,'x.cjs'));const tmp=mkdtempSync('/tmp/nd-shell-test-');const stub=join(root,'scripts/preview/ui-stubs.tsx');
  await esbuild.build({entryPoints:[join(root,'scripts/preview/defter-entry.tsx')],bundle:true,platform:'node',format:'cjs',outfile:tmp+'/ssr.cjs',jsx:'automatic',logLevel:'silent',define:{'process.env.NODE_ENV':'"production"'},nodePaths:[NM],
    alias:{'@':root,'sonner':stub},plugins:[{name:'s',setup(b){b.onResolve({filter:/^@\/components\/ui\/(dialog|select|alert-dialog|table|sidebar|sonner|dropdown-menu|tabs)$/},()=>({path:stub}));b.onResolve({filter:/^recharts$/},()=>({path:stub}));b.onResolve({filter:/^react(-dom)?(\/.*)?$/},a=>({path:require.resolve(a.path,{paths:[NM]})}))}}]});
  S=require(tmp+'/ssr.cjs');rmSync(tmp,{recursive:true,force:true});return S;
}
const text=h=>h.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');

test('üst çubuk: kırıntı ve geliştirici durum düğmeleri yok; sağda "Yanlış ekle" ve kullanıcı etiketi',{skip},async()=>{
  const h=(await load()).shell('archive');const top=h.slice(h.indexOf('<header class="topbar"'),h.indexOf('</header>'));
  assert.ok(!top.includes('crumb'));assert.ok(!/Supabase|OpenAI/.test(top));
  assert.match(top,/topbar-add primary/);assert.match(top,/Yanlış ekle/);assert.match(top,/private-label/);
});
test('sayfa başlığı: eyebrow yok, h1 + tek açıklama; "Yanlış ekle" başlıkta yok',{skip},async()=>{
  const h=(await load()).shell('archive');const ph=h.slice(h.indexOf('<div class="page-heading'),h.indexOf('<div class="view"'));
  assert.ok(!ph.includes('eyebrow'));assert.match(ph,/<h1>Yanlış defteri\.<\/h1><p>Yanlışların ders ve konuya göre tek yerde\.<\/p>/);assert.ok(!ph.includes('Yanlış ekle'));
});
test('kenar çubuğu gezinmesinde "Programı oluştur" yok; Bugün boş durumunda birincil olarak var',{skip},async()=>{
  const m=await load();const h=m.shell('home');const side=h.slice(h.indexOf('<aside'),h.indexOf('</aside>'));
  assert.ok(!side.includes('Programı oluştur'));assert.match(h,/class="primary"[^>]*>.*?Programı oluştur/s);
  assert.match(h.slice(h.indexOf('<header class="topbar"')),/topbar-add secondary/);
});
test('ekran başına tek kobalt: üst çubuk "Yanlış ekle" yalnız Defter\'te birincil, diğer ekranlarda ikincil',{skip},async()=>{
  const m=await load();
  for(const withPlan of [true,false])for(const v of ['home','program','resources','archive','report','exams','notes','settings']){
    const h=m.shell(v,{withPlan,dev:false});const top=h.slice(h.indexOf('<header class="topbar"'),h.indexOf('</header>'));
    assert.match(top,v==='archive'?/topbar-add primary/:/topbar-add secondary/,v+' plan='+withPlan);
  }
});
test('Ayarlar .view okuma genişliği; Notlar ve Defter geniş; alt çubuk etiketleri',{skip},async()=>{
  const m=await load();assert.match(m.shell('notes'),/data-view="notes" data-width="wide"/);assert.match(m.shell('settings'),/data-width="reading"/);assert.match(m.shell('archive'),/data-width="wide"/);
  assert.match(text(m.shell('archive').slice(m.shell('archive').indexOf('<nav class="mobile-bar"'))),/Bugün Program Defter Daha fazla/);
});
test('giriş sayfası: kahraman metni aynı; yalnız kahraman ve fiyat birincili kobalt, üst çubuk ve kapanış siyah',{skip},async()=>{
  const h=(await load()).landing();
  assert.match(h,/Soruyu çek\.<br\/>Gerisini <span class="lp-accent">netudu<\/span> bilsin\./);
  const nav=h.slice(h.indexOf('<header class="lp-nav"'),h.indexOf('</header>'));
  assert.match(nav,/class="lp-link"[^>]*>Giriş yap/);assert.match(nav,/lp-btn ink[^>]*>7 gün ücretsiz dene/);assert.ok(!nav.includes('solid'));
  assert.equal((h.match(/lp-btn solid/g)||[]).length,2);
  assert.match(h,/lp-btn solid lg[^>]*>7 gün ücretsiz başla/);assert.match(h,/lp-quiet lg[^>]*>Nasıl çalıştığını gör/);
  assert.match(h.slice(h.indexOf('lp-close')),/lp-btn ink lg/);
});

// Yanlış defteri (PR 4): araç çubuğu, boş durum, kontrol şeridi, yükleme ve soru penceresi
const count=(h,re)=>(h.match(re)||[]).length;
test('Defter araç çubuğu: arama + "Filtreler" + görünüm seçici; tek "Dışa aktar" menüsü; eski dağınık düğmeler yok',{skip},async()=>{
  const h=(await load()).defter();
  assert.match(h,/class="filters-btn"[^>]*aria-expanded="false"[^>]*aria-label="Filtreler"/);
  assert.equal(count(h,/Dışa aktar/g),1);
  assert.match(h,/Excel \(\.xlsx\)/);assert.match(h,/ CSV</);assert.match(h,/Yazdır \/ PDF/);
  assert.ok(!/Excel indir/.test(h));assert.ok(!/type="month"/.test(h));
  assert.match(h,/aria-label="Görünüm"/);assert.match(h,/6 soru/);
  const ph=h.slice(h.indexOf('<div class="page-heading'),h.indexOf('<div class="view"'));
  assert.ok(!ph.includes('Yazdır'),'Defter başlığında Yazdır / PDF yok');
});
test('Aylık rapor başlığında Yazdır / PDF kalır',{skip},async()=>{
  const h=(await load()).shell('report');const ph=h.slice(h.indexOf('<div class="page-heading'),h.indexOf('<div class="view"'));
  assert.match(ph,/Yazdır \/ PDF/);
});
test('Filtre paneli açıkken: 5 alan; Ay boşken "Tüm aylar"; temizle düğmesi panelde',{skip},async()=>{
  const h=(await load()).defter({filtersOpen:true});const p=h.slice(h.indexOf('id="archive-filters"'));
  for(const l of ['Ders','Sınav','Durum','Hata türü','Ay'])assert.match(p,new RegExp('<span>'+l+'</span>'));
  assert.match(p,/Tüm aylar/);assert.match(p,/Filtreleri temizle/);
  assert.match(h,/aria-expanded="true"/);
});
test('Defter boşken: üç adımlı anlatım, tek birincil "İlk yanlışını ekle", üst çubuk düğmesi ikincil, araç çubuğu yok',{skip},async()=>{
  const h=(await load()).defter({rows:[]});
  assert.match(h,/class="primary"[^>]*>İlk yanlışını ekle</);
  assert.equal(count(h,/>İlk yanlışını ekle</g),1);
  assert.match(h,/empty-steps/);assert.match(h.slice(h.indexOf('<header class="topbar"')),/topbar-add secondary/);
  assert.ok(!h.includes('filters-btn'));
  assert.ok(h.indexOf('empty-steps')<h.indexOf('>İlk yanlışını ekle<'),'düğme anlatımın altında');
});
test('Defter doluyken üst çubuk "Yanlış ekle" birincil; "İlk yanlışını ekle" yok',{skip},async()=>{
  const h=(await load()).defter();
  assert.match(h.slice(h.indexOf('<header class="topbar"')),/topbar-add primary/);assert.ok(!h.includes('İlk yanlışını ekle'));
});
test('Kontrol bekleyenler şeridi: yalnız tanınamayan soru varken, sayı mevcut sayımdan',{skip},async()=>{
  const m=await load();
  assert.ok(!m.defter().includes('pending-strip'));
  const h=m.defter({rows:m.pendingRows});
  assert.match(h,/class="pending-strip"/);assert.match(h,/2 soruyu yapay zekâ tanıyamadı/);assert.match(h,/<b>Kontrol et<\/b>/);
  assert.ok(h.indexOf('pending-strip')<h.indexOf('defter-bar'),'şerit araç çubuğunun üstünde');
});
test('Yanlış ekle penceresi: üstte kapat + ortada başlık; iki büyük kutu; 3 sütun ızgara; tek birincil "N soruyu tanı"',{skip},async()=>{
  const m=await load();const h=m.pick(3);
  assert.match(h,/class="dlg-close"[^>]*aria-label="Kapat"/);assert.match(h,/<h2>Yanlış ekle<\/h2>/);
  assert.match(h,/cap-btn dark[^>]*>.*Fotoğraf çek.*Arka arkaya çekebilirsin/s);assert.match(h,/cap-btn soft[^>]*>.*Galeriden seç.*İstediğin kadar soru/s);
  assert.equal(count(h,/class="cap-shot"/g),3);assert.equal(count(h,/class="primary /g),1);assert.match(h,/3 soruyu tanı/);
  const e=m.pick(0);assert.match(e,/disabled=""[^>]*>.*Önce soru seç/s);
});
test('Yapay zekâ kapalıyken bilgi kutusu ayrıdır; açıkken yoktur',{skip},async()=>{
  const m=await load();const off=m.pick(1,false);
  assert.match(off,/class="cap-info" role="note"><svg[^>]*>.*<\/svg><p>Yapay zekâ şu an kapalı: /s);
  assert.ok(!/class="cap-hint"[^>]*>[^<]*Yapay zekâ şu an kapalı/.test(off));
  assert.ok(!m.pick(1,true).includes('cap-info'));
});
test('Etiket ekranı: ilerleme çizgileri, "Kontrol et" kum kart, altta tek birincil "N soruyu deftere ekle"',{skip},async()=>{
  const m=await load();const h=m.tag(false);
  assert.match(h,/class="tag-progress"/);assert.match(h,/tag-card review/);assert.match(h,/Kontrol et/);
  assert.match(h,/3 soruyu deftere ekle/);assert.equal(count(h,/class="primary full cap-main"/g),1);
  assert.ok(!/EMİN OLAMADIK|DÜZENLENİYOR/.test(h));
  assert.match(h,/Tekrar günleri kendiliğinden planlanır/);
});
test('Soru penceresi: birincil çözüm, ikincil "Not oluştur", üç nokta menüsünde Yazdır / Düzenle / Sil (sil kırmızı)',{skip},async()=>{
  const h=(await load()).soru();const b=h.slice(h.indexOf('dialog-bottom'));
  assert.ok(b.indexOf('class="primary"')<b.indexOf('Not oluştur'));assert.ok(b.indexOf('Not oluştur')<b.indexOf('aria-label="Diğer eylemler"'));
  assert.match(b,/Yazdır<.*Düzenle<.*data-variant="destructive"[^>]*>.*Sil</s);
  assert.equal(count(h,/class="primary"/g),1,'pencerede tek birincil');
});
