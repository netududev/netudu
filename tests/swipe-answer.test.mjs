import assert from 'node:assert/strict';
const A=await import(new URL('../lib/swipe/answer.ts',import.meta.url).href);
let n=0;const t=(name,f)=>Promise.resolve().then(f).then(()=>{n++;console.log('ok  ',name)},e=>{console.log('FAIL',name,'\n',e.stack?.split('\n').slice(0,4).join('\n'));process.exitCode=1});
await t('şık harfi: "B", "b)", " B " → B; A–E hepsi',()=>{for(const v of ['B','b)',' B ','b.','(B)'.slice(1),'B:'])assert.equal(A.optionLetter(v),'B',v);for(const c of 'ABCDE')assert.equal(A.optionLetter(c.toLowerCase()),c)});
await t('şık harfi yok: "12", "x=3", boş, çoklu harf, E dışı, null',()=>{for(const v of ['12','x=3','','   ','AB','F','Doğru',null,undefined])assert.equal(A.optionLetter(v),null,String(v))});
console.log(n+' test geçti');
