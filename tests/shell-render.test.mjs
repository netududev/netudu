// Kabuk ve giriş sayfası: gerçek bileşenlerin react-dom/server çıktısında metin/sınıf denetimi.
// esbuild ve react /opt/npm-tools (ya da NODE_PATH) altında yoksa testler atlanır. Radix kabukları scripts/preview/ui-stubs.tsx ile değiştirilir.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtempSync,rmSync} from 'node:fs';
import {join,dirname,delimiter} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const dirs=[...(process.env.NODE_PATH||'').split(delimiter).filter(Boolean),'/opt/npm-tools/node_modules'];
let NM=null,esbuild=null;
for(const d of dirs){try{const r=createRequire(join(d,'x.cjs'));esbuild=r('esbuild');r.resolve('react-dom/server');NM=d;break}catch{}}
const skip=!esbuild&&'esbuild/react bulunamadı';
let S=null;
async function load(){
  if(S)return S;
  const require=createRequire(join(NM,'x.cjs'));const tmp=mkdtempSync('/tmp/nd-shell-test-');const stub=join(root,'scripts/preview/ui-stubs.tsx');
  await esbuild.build({entryPoints:[join(root,'scripts/preview/shell-entry.tsx')],bundle:true,platform:'node',format:'cjs',outfile:tmp+'/ssr.cjs',jsx:'automatic',logLevel:'silent',define:{'process.env.NODE_ENV':'"production"'},nodePaths:[NM],
    alias:{'@':root,'sonner':stub},plugins:[{name:'s',setup(b){b.onResolve({filter:/^@\/components\/ui\/(dialog|select|alert-dialog|table|sidebar|sonner)$/},()=>({path:stub}));b.onResolve({filter:/^@\/docs\/proof\//},a=>({path:join(root,a.path.slice(2)+'.tsx')}));b.onResolve({filter:/^react(-dom)?(\/.*)?$/},a=>({path:require.resolve(a.path,{paths:[NM]})}))}}]});
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
