// Bugün, Program, sihirbaz ve Kaynaklar: gerçek bileşenlerin react-dom/server çıktısında metin/sınıf denetimi (shell-render.test.mjs kalıbı).
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
  const require=createRequire(join(NM,'x.cjs'));const tmp=mkdtempSync('/tmp/nd-program-test-');const stub=join(root,'scripts/preview/ui-stubs.tsx');
  await esbuild.build({entryPoints:[join(root,'scripts/preview/program-entry.tsx')],bundle:true,platform:'node',format:'cjs',outfile:tmp+'/ssr.cjs',jsx:'automatic',logLevel:'silent',define:{'process.env.NODE_ENV':'"production"'},nodePaths:[NM],
    alias:{'@':root,'sonner':stub},plugins:[{name:'s',setup(b){b.onResolve({filter:/^@\/components\/ui\/(dialog|select|alert-dialog|table|sidebar|sonner|dropdown-menu|tabs)$/},()=>({path:stub}));b.onResolve({filter:/^recharts$/},()=>({path:stub}));b.onResolve({filter:/^react(-dom)?(\/.*)?$/},a=>({path:require.resolve(a.path,{paths:[NM]})}))}}]});
  S=require(tmp+'/ssr.cjs');rmSync(tmp,{recursive:true,force:true});return S;
}
const text=h=>h.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
const count=(h,re)=>(h.match(re)||[]).length;
const between=(h,a,b)=>{const i=h.indexOf(a);const j=h.indexOf(b,i+1);return i<0?'':h.slice(i,j<0?undefined:j)};

test('Bugün: başlık eylemi yalnız "Programı düzenle"; odak kartında tek birincil; akış 2fr + tekrarlar/cümle yan sütunda',{skip},async()=>{
  const S=await load();const h=S.bugun({resources:S.sampleResources});
  const actions=between(h,'class="actions"','</div>');
  assert.match(text(actions),/Programı düzenle/);assert.doesNotMatch(text(actions),/Yanlış ekle/);
  assert.equal(count(between(h,'class="td-focus','</section>'),/class="primary"/g),1);
  const cols=between(h,'class="td-columns"','</section>');
  assert.ok(cols.indexOf('Bugünün akışı')>0&&cols.indexOf('Bugünün akışı')<cols.indexOf('Bugünkü tekrarların'),'akış önce, tekrarlar yan sütun');
  assert.match(cols,/class="td-aside"/);assert.match(cols,/GÜNÜN CÜMLESİ/);
});
test('Bugün: plan yokken tekrarlar ve cümle eski iki sütunlu dashboard-grid içinde kalır',{skip},async()=>{
  const S=await load();const h=S.bugunBos();
  assert.doesNotMatch(h,/class="td-columns"/);assert.match(h,/class="dashboard-grid"/);
});
// Gün tamamlanma, tekrar sorularından bağımsız denetlenir (rows:[]) ve sahte saatle haftanın 7 gününde koşar;
// örnek soruların next_review tarihi sabit olduğundan gerçek tarihe bağlı olmamalıdır.
test('Bugün: gün tamamsa .td-focus.is-done ve kum ışıma sınıfı (haftanın 7 günü, sabit saat)',{skip},async()=>{
  const RealDate=Date;
  try{
    for(let d=16;d<=22;d++){ // 2026-11-16 Pzt .. 2026-11-22 Paz
      const fixed=new RealDate(2026,10,d,12,0,0).getTime();
      globalThis.Date=class extends RealDate{constructor(...a){a.length?super(...a):super(fixed)}static now(){return fixed}};
      S=null;const SS=await load();const h=SS.bugun({doneToday:true,rows:[]});
      assert.match(h,/class="td-focus is-done/,'2026-11-'+d);
    }
  }finally{globalThis.Date=RealDate;S=null}
});
test('Program: 7 gün sekmesi, tam bir seçili kart; kartlardaki Tamamla ikincil, ekranda birincil yok',{skip},async()=>{
  const S=await load();const h=S.program({resources:S.sampleResources});
  const tabs=between(h,'class="day-tabs"','</div>');
  assert.equal(count(tabs,/<button/g),7);assert.equal(count(tabs,/aria-pressed="true"/g),1);
  assert.equal(count(h,/class="day-card[^"]*\bsel\b/g),1);
  const grid=between(h,'class="day-grid"','</section>');
  assert.ok(count(grid,/Tamamla/g)>=5);assert.doesNotMatch(grid,/class="primary"/);
  assert.match(grid,/class="secondary"[^>]*><svg[^>]*>[\s\S]*?<\/svg> Tamamla/);
  assert.equal(count(between(h,'class="week-chips"','</div>'),/class="on /g),1);
});
test('Sihirbaz: üstte kapat + başlık, "Adım 1 / 3", Geri hayalet ve devre dışı, sağda tek birincil "Devam"',{skip},async()=>{
  const S=await load();const h=S.sihirbaz(false);
  assert.match(h,/class="dlg-bar"/);assert.match(text(h),/Adım 1 \/ 3/);
  const nav=between(h,'class="wizard-nav"','</div>');
  assert.match(nav,/class="secondary ghost" disabled/);assert.equal(count(nav,/class="primary"/g),1);
  assert.match(text(nav),/Devam/);assert.doesNotMatch(text(nav),/Devam et/);
  assert.ok(h.indexOf('class="wz-top"')>=0&&h.indexOf('class="wz-top"')<h.indexOf('class="wizard-body"')&&h.indexOf('class="wizard-body"')<h.indexOf('class="wizard-nav"'));
});
test('Kaynaklar: üç kutulu özet; sayfada tek birincil (ilk aktif kaynak); kartlarda ⋯ menüsü Düzenle + Sil; "Devam et" bağlantısı',{skip},async()=>{
  const S=await load();const h=S.kaynaklar();
  assert.equal(count(between(h,'class="res-stats"','</dl>'),/<dt>/g),3);
  const body=between(h,'class="res-section"','</main>');
  assert.equal(count(body,/class="primary"/g),1,'tek kobalt birincil');
  assert.match(between(body,'345 TYT Matematik','</article>'),/class="primary"[^>]*>[\s\S]*?Bugünkünü bitirdim/);
  assert.equal(count(body,/diğer eylemler/g),4);assert.equal(count(body,/danger-item/g),4);
  assert.equal(count(body,/> Düzenle</g),4);
  assert.match(body,/Devam et/);
});
test('Kaynaklar: oynatma listesi kartında sayı ve çubuk aynı satırda (rc-progress), çubuk ilerleme verisinden',{skip},async()=>{
  const S=await load();const h=S.kaynaklar();
  const card=between(h,'aria-label="Matematik kampı"','</article>');
  const row=between(card,'class="rc-progress"','</div>');
  assert.match(text(row),/12\/40 video/);assert.match(row,/role="progressbar"/);assert.match(row,/width:30%/);
});
test('Kaynaklar: bitmiş kaynak varsa tek birincil yine ilk bitmemiş kaynakta (liste başı değil)',{skip},async()=>{
  const S=await load();
  const only=[{...S.sampleResources[1],done:60},S.sampleResources[0]];
  const h=S.kaynaklar({resources:only});
  assert.equal(count(between(h,'class="res-section"','</main>'),/class="primary"/g),1);
  assert.match(between(h,'aria-label="Matematik kampı"','</article>'),/class="primary"[^>]*aria-label="Devam et/);
});
