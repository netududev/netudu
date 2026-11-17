import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const R=new URL('../lib/',import.meta.url).href;const V=await import(R+'swipe/server.ts');const S=await import(R+'study.ts');
let n=0;const t=(name,f)=>Promise.resolve().then(f).then(()=>{n++;console.log('ok  ',name)},e=>{console.log('FAIL',name,'\n',e.stack?.split('\n').slice(0,4).join('\n'));process.exitCode=1});
await t('markLearned: aşama=reviewIntervals.length, vade boş, reviewed=1',()=>assert.deepEqual(V.learnedState(),{stage:S.reviewIntervals.length,next:null,reviewed:1}));
await t('markLearned: review_log\'a satır eklenmez (log yalnız verilen değerle dönmez, saf durum nesnesinde log yok)',()=>assert.equal('log' in V.learnedState(),false));
await t('fotoğraf yanıtı Cache-Control: private, max-age=604800, immutable',()=>{assert.equal(V.IMAGE_CACHE_CONTROL,'private, max-age=604800, immutable');assert.equal(604800,7*86400)});
// Route gerçekten çağrılamıyor (owner/oturum + D1/R2 gerekir): kaynak bağlama testi saf yardımcıların route'ta kullanıldığını sabitler.
const route=p=>readFileSync(new URL('../app/api/questions/'+p,import.meta.url),'utf8');
await t('route bağlantısı: PATCH şeması markLearned alır ve learnedState kullanır; log satırı eklemez',()=>{
  const s=route('[id]/route.ts');assert.match(s,/markLearned:z\.boolean\(\)\.optional\(\)/);assert.match(s,/if\(d\.markLearned\)\{const l=learnedState\(\);stage=l\.stage;next=l\.next;reviewed=l\.reviewed\}/);
  const seg=s.match(/if\(d\.markLearned\)\{[^}]*\}/)[0];assert.ok(!/log/.test(seg))});
await t('route bağlantısı: fotoğraf GET Cache-Control sabitini kullanır; 404 yolları (AppError) korunur',()=>{
  const s=route('[id]/image/route.ts');assert.match(s,/'Cache-Control':IMAGE_CACHE_CONTROL/);assert.ok(!s.includes('no-store'));assert.equal((s.match(/AppError\('Fotoğraf bulunamadı\.',404\)/g)||[]).length,2)});
console.log(n+' test geçti');
