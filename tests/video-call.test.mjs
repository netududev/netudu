import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const R=new URL('../lib/',import.meta.url).href;
const {videoCallEffects,shouldAutoLoad,autoKey,emptyVideosMessage}=await import(R+'video-call.ts');
let n=0;const t=(name,f)=>Promise.resolve().then(f).then(()=>{n++;console.log('ok  ',name)},e=>{console.log('FAIL',name,'\n',e.stack?.split('\n').slice(0,4).join('\n'));process.exitCode=1});
await t('otomatik yükleme: toast yok, sayaç yok',()=>{assert.deepEqual(videoCallEffects({}),{consumes:false,toast:null})});
await t('yeniden ara: sayaç artar, yenilendi toast',()=>{assert.deepEqual(videoCallEffects({refresh:true}),{consumes:true,toast:'Video listesi yenilendi.'})});
await t('uygun değil: sayaç artar, not alındı toast',()=>{const e=videoCallEffects({reject:'https://www.youtube.com/watch?v=abc'});assert.equal(e.consumes,true);assert.match(e.toast,/Not alındı/)});
await t('refresh:false tek başına hak düşürmez (sunucu koşuluyla aynı)',()=>{assert.equal(videoCallEffects({refresh:false}).consumes,false)});
await t('shouldAutoLoad: yalnız boş, bildirimsiz, meşgul olmayan ve denenmemişte',()=>{
 assert.equal(shouldAutoLoad({count:0,notice:'',busy:false,tried:false}),true);
 assert.equal(shouldAutoLoad({count:1,notice:'',busy:false,tried:false}),false);
 assert.equal(shouldAutoLoad({count:0,notice:'x',busy:false,tried:false}),false);
 assert.equal(shouldAutoLoad({count:0,notice:'',busy:true,tried:false}),false);
 assert.equal(shouldAutoLoad({count:0,notice:'',busy:false,tried:true}),false)});
await t('autoKey: soru, ders, konu ve çözüm durumuyla değişir',()=>{
 const q={id:'a',subject:'Matematik',topic:'Türev'};const k=autoKey(q,false);
 assert.equal(k,'a|Matematik|Türev|0');
 assert.notEqual(autoKey({...q,topic:'Limit'},false),k);assert.notEqual(autoKey({...q,subject:'Fizik'},false),k);assert.notEqual(autoKey({...q,id:'b'},false),k);
 assert.notEqual(autoKey(q,true),k)});
await t('emptyVideosMessage: ağ hatası "bulunamadı"dan ayrı; öncelik sırası',()=>{
 const m=emptyVideosMessage;const base={busy:false,notice:'',tried:true,failed:false};
 assert.equal(m({...base,busy:true}),'Videolar aranıyor');
 assert.equal(m({...base,notice:'N'}),'N');
 assert.equal(m({...base,failed:true}),"Videolar yüklenemedi; Yeniden ara'yı dene.");
 assert.equal(m(base),'Video bulunamadı. Yeniden ara düğmesini dene.');
 assert.equal(m({...base,tried:false}),'Videolar yükleniyor.')});
await t('diyalog: autoKey ve emptyVideosMessage kullanılır; bayrak onLoad içinde korunur',()=>{
 const s=readFileSync(new URL('../app/study/question-dialog.tsx',import.meta.url),'utf8');
 assert.match(s,/autoKey\(/);assert.match(s,/emptyVideosMessage\(/);assert.doesNotMatch(s,/autoTried\.current\.has\(q\.id\)/);assert.doesNotMatch(s,/autoTried\.current\.add\(q\.id\)/);
 assert.match(s,/if\(!autoTried\.current\.has\(key\)\)/)});
await t('diyalog: video yan etkisi yardımcıdan gelir, otomatik çağrı refresh/reject taşımaz',()=>{
 const s=readFileSync(new URL('../app/study/question-dialog.tsx',import.meta.url),'utf8');
 assert.match(s,/videoCallEffects\(/);assert.match(s,/shouldAutoLoad\(/);
 assert.doesNotMatch(s,/if\(s\.ai\)s\.bumpUsage\('video'\)/);
 assert.doesNotMatch(s,/video aranıyor|bir iki dakika|video birlikte/i)});
console.log(n+' test');
