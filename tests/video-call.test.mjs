import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const R=new URL('../lib/',import.meta.url).href;
const {videoCallEffects,shouldAutoLoad}=await import(R+'video-call.ts');
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
await t('diyalog: video yan etkisi yardımcıdan gelir, otomatik çağrı refresh/reject taşımaz',()=>{
 const s=readFileSync(new URL('../app/study/question-dialog.tsx',import.meta.url),'utf8');
 assert.match(s,/videoCallEffects\(/);assert.match(s,/shouldAutoLoad\(/);
 assert.doesNotMatch(s,/if\(s\.ai\)s\.bumpUsage\('video'\)/);
 assert.doesNotMatch(s,/video aranıyor|bir iki dakika|video birlikte/i)});
console.log(n+' test');
