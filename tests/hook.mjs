// Test yükleyicisi: ../server'ı sahte modülden çözer; zod yüklü değilse ND_ZOD_PATH ya da
// NODE_PATH altından alır (bulunamazsa açık hata); uzantısız göreli içe aktarmaları .ts'e çevirir
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {existsSync} from 'node:fs';
import {join,delimiter} from 'node:path';

function zodFallback(){
  const cands=[];
  if(process.env.ND_ZOD_PATH)cands.push(process.env.ND_ZOD_PATH);
  for(const d of (process.env.NODE_PATH||'').split(delimiter).filter(Boolean)){
    cands.push(join(d,'zod','index.js'),join(d,'zod'));
  }
  for(const c of cands){
    try{return pathToFileURL(createRequire(import.meta.url).resolve(c)).href}catch{}
    if(existsSync(c)&&/\.[cm]?js$/.test(c))return pathToFileURL(c).href;
  }
  throw new Error('zod bulunamadı: "npm install" çalıştırın ya da ND_ZOD_PATH (zod/index.js yolu) ya da NODE_PATH (zod\'un bulunduğu node_modules) verin.');
}

export async function resolve(spec,ctx,next){
  if(spec==='zod'){try{return await next(spec,ctx)}catch{return {url:zodFallback(),shortCircuit:true,format:'module'}}}
  if(spec==='../server')return {url:new URL('./server-stub.mjs',import.meta.url).href,shortCircuit:true,format:'module'};
  if(spec.startsWith('.')&&!/\.[a-z]+$/.test(spec)){try{return await next(spec+'.ts',ctx)}catch{}}
  return next(spec,ctx)}
