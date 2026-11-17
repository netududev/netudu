// Supabase Storage bağdaştırıcısı: global fetch taklit edilir, ağ kullanılmaz
import assert from 'node:assert/strict';
const S=await import(new URL('../lib/supabase-storage.ts',import.meta.url).href);
const realFetch=globalThis.fetch;
let n=0;const t=async(name,f)=>{S.resetBucketCache();try{await f()}catch(e){console.log('FAIL',name,e.message);process.exitCode=1;globalThis.fetch=realFetch;return}globalThis.fetch=realFetch;n++;console.log('ok  ',name)};
const KEY='eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiJ9.SECRETSIG';
const cfg={url:'https://x.supabase.co',key:KEY};
const hdr=(extra)=>({apikey:KEY,Authorization:'Bearer '+KEY,'Content-Type':'application/json',...(extra||{})});
const resp=(status,body,headers)=>new Response(typeof body==='string'||body instanceof Uint8Array?body:JSON.stringify(body??{}),{status,headers});
// yollara göre yanıt veren taklit fetch; çağrıları kaydeder
const mock=(handler)=>{const calls=[];globalThis.fetch=async(url,init)=>{calls.push({url:String(url),method:init?.method||'GET'});return handler(String(url),init||{},calls)};return calls};
const bytes=new Uint8Array([255,216,1,2,3]);
const put=(fb)=>S.putObject(cfg,hdr,'u1/q1',bytes,'image/jpeg',fb);
const failing=async(p)=>{try{await p}catch(e){return e}assert.fail('hata bekleniyordu')};

await t('put: 200 başarılı, bellek yedeğine de yazar',async()=>{
 const calls=mock((u)=>u.includes('/storage/v1/bucket/')?resp(200,{}):resp(200,{Key:'k'}));
 let wrote=null;await put({put:async(k,v)=>{wrote=k}});
 assert.equal(wrote,'u1/q1');assert.ok(calls.some(c=>c.method==='POST'&&c.url.endsWith('/object/question-images/u1/q1')))});
for(const st of [403,400,500]){
 await t(`put: ${st} => StorageError 502, yedek yazılmaz, anahtar sızmaz`,async()=>{
  let wrote=false;mock((u)=>u.includes('/storage/v1/bucket/')?resp(200,{}):resp(st,{message:'new row violates RLS '+KEY+' https://x.supabase.co'}));
  const e=await failing(put({put:async()=>{wrote=true}}));
  assert.ok(e instanceof S.StorageError);assert.equal(e.status,502);
  assert.match(e.message,new RegExp(`HTTP ${st}`));assert.match(e.message,/question-images/);
  assert.ok(!e.message.includes('SECRETSIG'));assert.ok(!e.message.includes('x.supabase.co'));assert.equal(wrote,false);
  assert.ok(e.detail.length<=200)})}
await t('put: ağ hatası => StorageError',async()=>{
 mock((u)=>{if(u.includes('/object/'))throw new TypeError('fetch failed');return resp(200,{})});
 const e=await failing(put(null));assert.ok(e instanceof S.StorageError);assert.match(e.message,/depoya yazılamadı/)});
await t('put: iletide en çok 200 karakter hata ayrıntısı',async()=>{
 mock((u)=>u.includes('/storage/v1/bucket/')?resp(200,{}):resp(413,{message:'a'.repeat(900)}));
 const e=await failing(put(null));assert.equal(e.detail.length,200)});
await t('put: bucket yok (404) => oluştur ve tekrar dene',async()=>{
 let uploads=0;const calls=mock((u,init)=>{
  if(u.includes('/storage/v1/bucket/'))return resp(404,{error:'not found'});
  if(u.endsWith('/storage/v1/bucket'))return resp(200,{name:'question-images'});
  uploads++;return uploads===1?resp(404,{message:'Bucket not found'}):resp(200,{})});
 await put(null);assert.equal(uploads,2);assert.ok(calls.some(c=>c.method==='POST'&&c.url.endsWith('/storage/v1/bucket')))});
await t('put: yükleme 400 "Bucket not found" => oluştur ve tekrar dene',async()=>{
 let uploads=0;mock((u)=>{
  if(u.includes('/storage/v1/bucket/'))return resp(200,{});
  if(u.endsWith('/storage/v1/bucket'))return resp(200,{});
  uploads++;return uploads===1?resp(400,{statusCode:'404',error:'Bucket not found'}):resp(200,{})});
 await put(null);assert.equal(uploads,2)});
await t('put: bucket GET 400 + oluşturma 403 + yükleme 200 => başarılı (yetkisiz anahtar, bucket panelden açılmış)',async()=>{
 let uploads=0,creates=0;mock((u)=>{
  if(u.includes('/storage/v1/bucket/'))return resp(400,{error:'Bucket not found'});
  if(u.endsWith('/storage/v1/bucket')){creates++;return resp(403,{message:'new row violates row-level security policy'})}
  uploads++;return resp(200,{Key:'k'})});
 await put(null);assert.equal(uploads,1);assert.equal(creates,1)});
await t('put: oluşturma 403 + yükleme 403 => StorageError (yükleme mesajıyla), oluşturma ayrıntısı maskeli',async()=>{
 mock((u)=>{if(u.includes('/storage/v1/bucket/'))return resp(404,{});if(u.endsWith('/storage/v1/bucket'))return resp(403,{message:'denied '+KEY});return resp(403,{message:'upload RLS'})});
 const e=await failing(put(null));assert.ok(e instanceof S.StorageError);
 assert.match(e.message,/depoya yazılamadı/);assert.match(e.message,/HTTP 403/);assert.match(e.message,/upload RLS/);
 assert.ok(!e.message.includes('SECRETSIG'));assert.equal(e.upstream,403)});
await t('put: oluşturma ağ hatası + yükleme 200 => başarılı; bucket önbelleğe alınmaz',async()=>{
 let gets=0;mock((u)=>{if(u.includes('/storage/v1/bucket/')){gets++;return resp(404,{})}if(u.endsWith('/storage/v1/bucket'))throw new TypeError('fetch failed');return resp(200,{})});
 await put(null);await put(null);assert.equal(gets,2)});
await t('put: yükleme 404 => oluştur başarısız (403) => tekrar yükleme 404 => hata yükleme hatasıdır, oluşturma hatası gölgelemez',async()=>{
 mock((u)=>{if(u.includes('/storage/v1/bucket/'))return resp(200,{});if(u.endsWith('/storage/v1/bucket'))return resp(403,{message:'create denied'});return resp(404,{message:'Bucket not found'})});
 const e=await failing(put(null));assert.ok(e instanceof S.StorageError);assert.match(e.message,/depoya yazılamadı/);assert.match(e.message,/HTTP 404/)});
await t('put: oluşturma başarılıysa (409 var) önbelleğe alınır',async()=>{
 const calls=mock((u)=>{if(u.includes('/storage/v1/bucket/'))return resp(404,{});if(u.endsWith('/storage/v1/bucket'))return resp(409,{});return resp(200,{})});
 await put(null);await put(null);assert.equal(calls.filter(c=>c.url.includes('/storage/v1/bucket/')).length,1)});
await t('put: StorageError.upstream ağ hatasında null, HTTP hatasında durum kodu',async()=>{
 mock((u)=>{if(u.includes('/object/'))throw new TypeError('fetch failed');return resp(200,{})});
 assert.equal((await failing(put(null))).upstream,null);
 mock((u)=>u.includes('/storage/v1/bucket/')?resp(200,{}):resp(413,{}));
 assert.equal((await failing(put(null))).upstream,413)});
await t('scrub: proje ref\'i tam host olmadan da maskelenir',async()=>{
 const c2={url:'https://abcdefghijklmnop.supabase.co',key:KEY};
 mock((u)=>u.includes('/storage/v1/bucket/')?resp(200,{}):resp(403,{message:'role of project abcdefghijklmnop denied'}));
 const e=await failing(S.putObject(c2,hdr,'k',bytes,'image/jpeg',null));
 assert.ok(!e.message.includes('abcdefghijklmnop'));assert.ok(!e.detail.includes('abcdefghijklmnop'))});
await t('storageErrorToApp: ağ hatası ve 5xx => 502; Supabase 4xx => 424; StorageError dışı => null',async()=>{
 const mk=(up)=>{const e=new S.StorageError('m','d');e.upstream=up;return e};
 assert.deepEqual(S.storageErrorToApp(mk(null)),{message:'m',status:502});
 assert.equal(S.storageErrorToApp(mk(500)).status,502);assert.equal(S.storageErrorToApp(mk(503)).status,502);
 for(const c of [400,403,404,413])assert.equal(S.storageErrorToApp(mk(c)).status,424);
 assert.equal(S.storageErrorToApp(new Error('x')),null)});
await t('shared.tsx yalnız 502/503/504 yeniden dener: 424 denenmez (kaynak taraması)',async()=>{
 const {readFileSync}=await import('node:fs');
 const src=readFileSync(new URL('../app/study/shared.tsx',import.meta.url),'utf8');
 const m=/if\(\(r\.status===[^)]*\)&&attempt<maxTries\)/.exec(src);assert.ok(m,'yeniden deneme koşulu bulunamadı');
 const codes=[...m[0].matchAll(/status===(\d+)/g)].map(x=>Number(x[1]));
 assert.deepEqual(codes,[502,503,504]);assert.ok(!codes.includes(424))});
await t('put: bucket doğrulandıktan sonra tekrar kontrol edilmez',async()=>{
 const calls=mock((u)=>resp(200,{}));await put(null);await put(null);
 assert.equal(calls.filter(c=>c.url.includes('/storage/v1/bucket/')).length,1)});
await t('get: 200 => arrayBuffer() ve body birlikte okunabilir, contentType taşır',async()=>{
 mock(()=>resp(200,bytes,{'content-type':'image/jpeg'}));
 const o=await S.getObject(cfg,hdr,'u1/q1',null);
 assert.deepEqual([...new Uint8Array(await o.arrayBuffer())],[...bytes]);
 assert.deepEqual([...new Uint8Array(await new Response(o.body).arrayBuffer())],[...bytes]);
 assert.equal(o.httpMetadata.contentType,'image/jpeg');assert.equal(o.size,5);assert.ok(!('bodyUsed' in o))});
for(const st of [404,400])await t(`get: ${st} => null`,async()=>{mock(()=>resp(st,{error:'Object not found'}));assert.equal(await S.getObject(cfg,hdr,'k',null),null)});
await t('get: 500 => null',async()=>{mock(()=>resp(500,{}));assert.equal(await S.getObject(cfg,hdr,'k',null),null)});
await t('get: ağ hatası => null',async()=>{mock(()=>{throw new TypeError('fetch failed')});assert.equal(await S.getObject(cfg,hdr,'k',null),null)});
await t('get: ağ hatası + bellek yedeği (yalnız body) => arrayBuffer() çalışır',async()=>{
 mock(()=>{throw new TypeError('fetch failed')});
 const fb={get:async()=>({body:new Blob([bytes]).stream()})};
 const o=await S.getObject(cfg,hdr,'k',fb);assert.deepEqual([...new Uint8Array(await o.arrayBuffer())],[...bytes])});
await t('get: 404 + yedek yok => null; yedek de boşsa null',async()=>{
 mock(()=>resp(404,{}));assert.equal(await S.getObject(cfg,hdr,'k',{get:async()=>null}),null)});
console.log(`supabase-storage: ${n} test geçti`);
