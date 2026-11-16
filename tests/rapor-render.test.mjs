// Aylık rapor, Denemeler, Ders notları ve Ayarlar: gerçek bileşenlerin react-dom/server çıktısında metin/sınıf denetimi (program-render.test.mjs kalıbı).
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
const skip=false;
let S=null;
async function load(){
  if(S)return S;
  const require=createRequire(join(NM,'x.cjs'));const tmp=mkdtempSync('/tmp/nd-rapor-test-');const stub=join(root,'scripts/preview/ui-stubs.tsx');
  await esbuild.build({entryPoints:[join(root,'scripts/preview/rapor-entry.tsx')],bundle:true,platform:'node',format:'cjs',outfile:tmp+'/ssr.cjs',jsx:'automatic',logLevel:'silent',define:{'process.env.NODE_ENV':'"production"'},nodePaths:[NM],
    alias:{'@':root,'sonner':stub},plugins:[{name:'s',setup(b){b.onResolve({filter:/^@\/components\/ui\/(dialog|select|alert-dialog|table|sidebar|sonner|dropdown-menu|tabs)$/},()=>({path:stub}));b.onResolve({filter:/^recharts$/},()=>({path:stub}));b.onResolve({filter:/^react(-dom)?(\/.*)?$/},a=>({path:require.resolve(a.path,{paths:[NM]})}))}}]});
  S=require(tmp+'/ssr.cjs');rmSync(tmp,{recursive:true,force:true});return S;
}
const text=h=>h.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
const count=(h,re)=>(h.match(re)||[]).length;
const between=(h,a,b)=>{const i=h.indexOf(a);const j=h.indexOf(b,i+1);return i<0?'':h.slice(i,j<0?undefined:j)};
const heading=h=>between(h,'class="page-heading','class="view"');
const view=h=>h.slice(h.indexOf('class="view"'));
const css=readFileSync(join(root,'app/styles/98-rapor-not-ayarlar.css'),'utf8');

test('Aylık rapor: ay seçici başlıkta, "Yazdır / PDF" yanında; gövdede tek birincil',async()=>{
  const S=await load();const h=S.rapor();const hd=heading(h);
  assert.match(hd,/month-select/);assert.match(hd,/type="month"/);assert.match(text(hd),/Yazdır \/ PDF/);
  assert.ok(hd.indexOf('month-select')<hd.indexOf('Yazdır'),'ay seçici Yazdır\'ın solunda');
  assert.doesNotMatch(view(h),/type="month"/);assert.doesNotMatch(text(view(h)),/Yazdır \/ PDF/);
  assert.equal(count(h,/class="primary"/g),1);
});
test('Denemeler: tek birincil "Deneme ekle" başlıkta; form Kaydet ikincil; liste satırları var',async()=>{
  const S=await load();const h=S.denemeler();
  assert.match(heading(h),/class="primary heading-add"[^>]*>.*Deneme ekle/);
  assert.equal(count(h,/class="primary[ "]/g),1);
  assert.match(between(h,'class="exam-form"','</form>'),/class="secondary"[^>]*disabled=""/);
  assert.equal(count(h,/<li><div><strong>/g),4);assert.match(h,/id="exam-name"/);
  const b=S.denemeler({empty:true});assert.equal(count(b,/class="primary[ "]/g),1);
});
test('Grafik renkleri: yalnız kobalt ve nötr gri jetonu (sabit renk yok)',()=>{
  const src=readFileSync(join(root,'app/study/exams.tsx'),'utf8');
  assert.doesNotMatch(src,/#[0-9a-fA-F]{3,8}\b/);
  assert.match(src,/stroke="var\(--brand\)"/);assert.match(src,/fill="var\(--fg3\)"/);
});
test('Ders notları: görsel not bölümleri, okuma genişliği ≤760, alttaki iki eylem eşit (ikincil+ikincil), ekranda tek birincil',async()=>{
  const S=await load();const h=S.notlar();
  for(const c of ['nv-lead','nv-layer','nv-rule','nv-steps','nv-pair','nv-memory'])assert.match(h,new RegExp(c));
  assert.match(text(h),/SIK HATA/);assert.match(text(h),/AYNI KALIP/);assert.match(text(h),/Akılda tut/);
  assert.equal(count(h,/class="primary[ "]/g),1);
  const acts=between(h,'class="actions note-actions"','</div>');assert.equal(count(acts,/<button/g),2);
  assert.match(css,/\[data-view=notes\] \.nv,[^{]*\{max-width:760px\}/);
  assert.match(css,/\.note-actions\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
});
test('Ayarlar: sekmeler hesap türüne göre; her sekme kendi bölümlerini gösterir',async()=>{
  const S=await load();
  const tabs=h=>[...h.matchAll(/role="tab"[^>]*>([^<]+)</g)].map(m=>m[1]);
  const want={profile:['Profil','Program','Görünüm'],membership:['Üyelik','Çözüm haklarım'],data:['Yedek','Excel ve PDF çıktısı','Aylık rapor'],account:['Hesap ve güvenlik']};
  for(const [t,hs] of Object.entries(want))for(const dev of [false,true]){
    const h=S.ayarlar(t,dev);assert.deepEqual(tabs(h),dev?['Profil','Üyelik','Veri','Hesap','Geliştirici']:['Profil','Üyelik','Veri','Hesap'],t);
    const got=[...between(h,'role="tabpanel"','</main>').matchAll(/<h2>([^<]+)<\/h2>/g)].map(m=>m[1]);
    for(const x of hs)assert.ok(got.includes(x),`${t}/${dev}: ${x} yok (${got})`);
    assert.ok(count(h,/class="primary[ "]/g)<=1,t);
  }
  const d=S.ayarlar('developer',true);const hs=[...between(d,'role="tabpanel"','</main>').matchAll(/<h2>([^<]+)<\/h2>/g)].map(m=>m[1]);
  assert.deepEqual(hs,['Kayıtlı kullanıcılar','OpenAI ve yapay zekâ bağlantısı','Supabase ve arka uç bağlantısı']);
  assert.doesNotMatch(d,/Developer|Özel\)|&amp;/);
  assert.equal(count(d,/class="primary[ "]/g),0);
});
test('Ayarlar: geliştirici olmayan hesapta Geliştirici sekmesi seçilse bile Profil açılır (türetilmiş seçim)',async()=>{
  const S=await load();const h=S.ayarlar('developer',false);
  assert.doesNotMatch(h,/Kayıtlı kullanıcılar|OpenAI ve yapay/);assert.match(h,/<h2>Profil<\/h2>/);
});
test('Ayarlar: Profil Kaydet bölümün sağ altında, değişiklik yokken pasif; Kaydet başka yerde birincil değil',async()=>{
  const S=await load();const h=S.ayarlar('profile',false);
  assert.match(between(h,'section-save','</form>'),/class="primary"[^>]*disabled=""/);
  assert.match(css,/section-save\{justify-content:flex-end/);
});
test('CSS: sabit renk yok (jeton), seçiciler ekrana özgü, reduced-motion var, globals.css içinde sıralı import',()=>{
  assert.doesNotMatch(css.replace(/\/\*.*?\*\//g,''),/#[0-9a-fA-F]{3,8}\b/);
  assert.match(css,/prefers-reduced-motion:reduce/);
  const rules=css.replace(/\/\*.*?\*\//gs,'').replace(/@media[^{]*\{/g,'').split('}').map(x=>x.split('{')[0].trim()).filter(Boolean);
  for(const sel of rules)assert.ok(/data-view|\.page-heading|\.settings-/.test(sel),'kapsamsız seçici: '+sel);
  const g=readFileSync(join(root,'app/globals.css'),'utf8').split('\n').filter(l=>l.startsWith('@import'));
  assert.equal(g[g.length-1],'@import "./styles/98-rapor-not-ayarlar.css";');assert.ok(g.indexOf('@import "./styles/95-program-kaynaklar.css";')<g.length-1);
});
