// Bellek kovası: get R2ObjectBody uyumlu nesne döndürür (arrayBuffer/body/httpMetadata/size).
// lib/memory-db.ts "parameter property" kullandığı için strip-only modda yüklenemez; alt süreçte
// --experimental-transform-types ile koşturulur.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const code=`
import assert from 'node:assert/strict';
const M=await import(${JSON.stringify(new URL('../lib/memory-db.ts',import.meta.url).href)});
const b=M.createMemoryBucket();
const bytes=new Uint8Array([255,216,1,2,3]);
await b.put('u/q',bytes,{httpMetadata:{contentType:'image/jpeg'}});
const o=await b.get('u/q');
assert.deepEqual([...new Uint8Array(await o.arrayBuffer())],[...bytes]);
assert.deepEqual([...new Uint8Array(await new Response(o.body).arrayBuffer())],[...bytes]);
assert.equal(o.httpMetadata.contentType,'image/jpeg');assert.equal(o.size,5);
assert.equal(await b.get('yok'),null);
console.log('ok');`;
const out=execFileSync(process.execPath,['--experimental-transform-types','--no-warnings','--import',new URL('./reg.mjs',import.meta.url).href,'--input-type=module','-e',code],{encoding:'utf8'});
assert.match(out,/ok/);
console.log('ok   memory-bucket: get arrayBuffer/body/httpMetadata/size');
