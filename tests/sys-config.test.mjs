// sys_config kalıcılığı: şema, Supabase hata günlüğü, yazma doğrulaması, OpenAI hata günlüğü (ağ yok, sahte fetch)
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const S=await import(new URL('../lib/supabase.ts',import.meta.url).href);
const O=await import(new URL('../lib/openai-log.ts',import.meta.url).href);
const realFetch=globalThis.fetch,realErr=console.error,realNow=Date.now;
let n=0;const t=async(name,f)=>{try{await f()}catch(e){console.log('FAIL',name,e.message);process.exitCode=1;return}finally{globalThis.fetch=realFetch;console.error=realErr;Date.now=realNow}n++;console.log('ok  ',name)};
const KEY='eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiJ9.SECRETSIG';
const cfg={url:'https://x.supabase.co',key:KEY,source:'runtime'};
const SECRET='sk-proj-SUPERGIZLI123';
const resp=(status,body)=>new Response(JSON.stringify(body??{}),{status});
const notFound=()=>resp(404,{code:'PGRST205',message:'Could not find the table public.sys_config in the schema cache'});
const capture=()=>{const logs=[];console.error=(...a)=>{logs.push(a.map(String).join(' '))};return logs};
const fakeDb=()=>({prepare(){const st={bind(){return st},async run(){return {success:true,meta:{changes:1}}},async first(){return null},async all(){return {results:[],meta:{changes:0}}}};return st}});
const INS="INSERT INTO sys_config (key,value) VALUES ('openai_api_key',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value";

await t('schema.sql: sys_config tablosu, RLS açık, politika yok, anon/authenticated REVOKE',()=>{
 const sql=readFileSync(new URL('../supabase/schema.sql',import.meta.url),'utf8');
 assert.match(sql,/CREATE TABLE IF NOT EXISTS public\.sys_config\s*\(\s*key text PRIMARY KEY,\s*value text NOT NULL\s*\)/);
 assert.match(sql,/ALTER TABLE public\.sys_config ENABLE ROW LEVEL SECURITY/);
 assert.match(sql,/REVOKE ALL ON public\.sys_config FROM anon, authenticated/);
 assert.ok(!/CREATE POLICY[^;]*sys_config/i.test(sql),'sys_config için politika olmamalı')});

await t('Supabase 404/PGRST205 yedek olsa bile supabase_query_failed günlüğü (durum+kod, değer yok)',async()=>{
 Date.now=()=>1_000_000;const logs=capture();globalThis.fetch=async()=>notFound();
 const db=S.createSupabaseD1(cfg,fakeDb());
 await db.prepare(INS).bind(SECRET).run();
 const all=logs.join('\n');
 assert.match(all,/supabase_query_failed/);assert.match(all,/404/);assert.match(all,/PGRST205/);
 assert.ok(!all.includes(SECRET));assert.ok(!all.includes('SECRETSIG'))});

await t('aynı hata dakikada bir kez; süre geçince tekrar yazılır',async()=>{
 const logs=capture();globalThis.fetch=async()=>notFound();
 const db=S.createSupabaseD1(cfg,fakeDb());
 Date.now=()=>2_000_000;
 for(let i=0;i<5;i++)await db.prepare(INS).bind(SECRET).run();
 const count=()=>logs.filter(l=>l.includes('supabase_query_failed')).length;
 const first=count();assert.ok(first>=1);
 await db.prepare(INS).bind(SECRET).run();assert.equal(count(),first);
 Date.now=()=>2_000_000+61_000;await db.prepare(INS).bind(SECRET).run();assert.ok(count()>first)});

await t('persistSysConfig: 404 => persisted false (durum+kod)',async()=>{
 Date.now=()=>3_000_000;capture();globalThis.fetch=async()=>notFound();
 const r=await S.persistSysConfig(cfg,{openai_api_key:SECRET,openai_model:'gpt-4o'});
 assert.equal(r.ok,false);assert.equal(r.status,404);assert.equal(r.code,'PGRST205')});
await t('persistSysConfig: 200/201 => ok true, anahtar gövdede, on_conflict=key',async()=>{
 let seen;globalThis.fetch=async(u,init)=>{seen={u:String(u),body:String(init.body),method:init.method};return new Response(null,{status:201})};
 const r=await S.persistSysConfig(cfg,{openai_api_key:SECRET,openai_model:'gpt-4o'});
 assert.equal(r.ok,true);assert.equal(seen.method,'POST');assert.match(seen.u,/\/rest\/v1\/sys_config\?on_conflict=key$/);
 assert.deepEqual(JSON.parse(seen.body),[{key:'openai_api_key',value:SECRET},{key:'openai_model',value:'gpt-4o'}])});
await t('persistSysConfig: ağ hatası => ok false',async()=>{
 capture();globalThis.fetch=async()=>{throw new TypeError('fetch failed')};
 const r=await S.persistSysConfig(cfg,{a:'b'});assert.equal(r.ok,false)});

await t('OpenAI hata günlüğü: durum+code+type, anahtar/istem yok',()=>{
 const logs=capture();
 O.logOpenAiFailure(401,{error:{code:'invalid_api_key',type:'invalid_request_error',message:'Incorrect API key '+SECRET+' prompt: gizli soru metni'}});
 const all=logs.join(' ');
 assert.match(all,/openai_request_failed/);assert.match(all,/401/);assert.match(all,/invalid_api_key/);assert.match(all,/invalid_request_error/);
 assert.ok(!all.includes(SECRET));assert.ok(!all.includes('gizli soru'))});
await t('OpenAI hata günlüğü: gövde yoksa/bozuksa yine durumu yazar',()=>{
 const logs=capture();O.logOpenAiFailure(502,null);O.logOpenAiFailure(500,'<html>');
 assert.equal(logs.length,2);assert.match(logs[0],/502/);assert.match(logs[1],/500/)});
console.log(`${n} test`);
