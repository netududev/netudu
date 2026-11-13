// Test yükleyicisi: zod'u /opt/npm-tools'tan, ../server'ı sahte modülden çözer; uzantısız göreli içe aktarmaları .ts'e çevirir
export async function resolve(spec,ctx,next){
  if(spec==='zod')return {url:'file:///opt/npm-tools/node_modules/zod/index.js',shortCircuit:true,format:'module'};
  if(spec==='../server')return {url:new URL('./server-stub.mjs',import.meta.url).href,shortCircuit:true,format:'module'};
  if(spec.startsWith('.')&&!/\.[a-z]+$/.test(spec)){try{return await next(spec+'.ts',ctx)}catch{}}
  return next(spec,ctx)}
