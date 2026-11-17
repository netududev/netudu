import assert from 'node:assert/strict';
const R=new URL('../lib/',import.meta.url).href;const SS=await import(R+'swipe/session.ts');
let n=0;const t=(name,f)=>Promise.resolve().then(f).then(()=>{n++;console.log('ok  ',name)},e=>{console.log('FAIL',name,'\n',e.stack?.split('\n').slice(0,4).join('\n'));process.exitCode=1});
const DAY='2026-11-16';
const base=()=>({...SS.newSession({day:DAY,subject:'Matematik',scope:'due',includeLearned:false,queue:['a','b','c','d']}),current:'x',history:['h1','gone'],results:{h1:{first:'bildim',wrong:0,skips:0},gone:{first:'bilemedim',wrong:1,skips:0}},struggle:['gone'],pending:[{id:'h1',review:'doğru',tries:0},{id:'gone',review:'yanlış',tries:1}]});
const mem=(init={})=>{const m={...init};return {getItem:k=>k in m?m[k]:null,setItem:(k,v)=>{m[k]=String(v)},removeItem:k=>{delete m[k]},key:i=>Object.keys(m)[i]??null,get length(){return Object.keys(m).length},m}};
const all=['a','b','c','d','x','h1','gone'];
await t('anahtar: kaydir:<kullanıcı>:<gün>',()=>assert.equal(SS.sessionKey('u1',DAY),'kaydir:u1:2026-11-16'));
await t('serialize/restore gidiş-dönüş aynı oturumu verir',()=>{const s=base();assert.deepEqual(SS.restore(SS.serialize(s),{day:DAY,ids:all}),s)});
await t('restore: bozuk JSON, boş, yanlış şekil, eski gün → null',()=>{
  for(const raw of ['{bozuk','',null,'42','null','{"day":"2026-11-16"}',JSON.stringify({...base(),queue:'x'}),JSON.stringify({...base(),day:'2026-11-15'})])assert.equal(SS.restore(raw,{day:DAY,ids:all}),null,String(raw))});
await t('restore: silinmiş soru kimlikleri kuyruk, geçmiş, sonuç, çalışılacak, bekleyen yazmadan ayıklanır',()=>{
  const r=SS.restore(SS.serialize(base()),{day:DAY,ids:['a','c','x','h1']});
  assert.deepEqual(r.queue,['a','c']);assert.equal(r.current,'x');assert.deepEqual(r.history,['h1']);assert.deepEqual(Object.keys(r.results),['h1']);assert.deepEqual(r.struggle,[]);assert.deepEqual(r.pending.map(p=>p.id),['h1']);
  assert.equal(SS.restore(SS.serialize(base()),{day:DAY,ids:['a']}).current,null,'silinen güncel kart düşer')});
await t('depolama: kaydet/yükle; hata ve bulunmayan depolama → null/false, fırlatmaz',()=>{
  const st=mem();assert.equal(SS.saveSession(st,'u1',base()),true);assert.deepEqual(SS.loadSession(st,'u1',DAY,all),base());
  const bad={getItem(){throw new Error('x')},setItem(){throw new Error('quota')},removeItem(){throw new Error('x')},key(){throw new Error('x')},length:1};
  assert.equal(SS.loadSession(bad,'u1',DAY,all),null);assert.equal(SS.saveSession(bad,'u1',base()),false);SS.purgeOldSessions(bad,'u1',DAY);
  assert.equal(SS.loadSession(null,'u1',DAY,all),null);assert.equal(SS.saveSession(null,'u1',base()),false);
  assert.equal(SS.loadSession(mem({[SS.sessionKey('u1',DAY)]:'{bozuk'}),'u1',DAY,all),null)});
await t('depolama: eski gün anahtarı silinir; bugünküne ve başka kullanıcıya dokunulmaz',()=>{
  const st=mem({'kaydir:u1:2026-11-15':'{}','kaydir:u1:2026-11-16':'{}','kaydir:u2:2026-11-10':'{}','baska':'1'});SS.purgeOldSessions(st,'u1',DAY);
  assert.deepEqual(Object.keys(st.m).sort(),['baska','kaydir:u1:2026-11-16','kaydir:u2:2026-11-10'])});
await t('bekleyen yazma: tries<3 denenir; başarıda çıkar; başarısızlıkta tries+1; 3 deneme sonra vazgeçilir ve sayılır',()=>{
  let p=SS.addPending([],'a','doğru');p=SS.addPending(p,'a','yanlış');assert.equal(p.length,1,'aynı soru ikinci kez eklenmez');p=SS.addPending(p,'b','yanlış');
  assert.deepEqual(SS.duePending(p).map(x=>x.id),['a','b']);
  for(let i=0;i<3;i++)p=SS.afterAttempt(p,'a',false);assert.deepEqual(SS.duePending(p).map(x=>x.id),['b']);assert.equal(SS.failedCount(p),1);
  p=SS.afterAttempt(p,'b',true);assert.deepEqual(p.map(x=>x.id),['a'])});
console.log(n+' test geçti');
