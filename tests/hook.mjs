// Test yükleyicisi: ../server'ı sahte modülden çözer; zod yüklü değilse /opt/npm-tools'tan alır;
// uzantısız göreli içe aktarmaları .ts'e çevirir
export async function resolve(spec,ctx,next){
  if(spec==='zod'){try{return await next(spec,ctx)}catch{return {url:'file:///opt/npm-tools/node_modules/zod/index.js',shortCircuit:true,format:'module'}}}
  if(spec==='../server')return {url:new URL('./server-stub.mjs',import.meta.url).href,shortCircuit:true,format:'module'};
  if(spec.startsWith('.')&&!/\.[a-z]+$/.test(spec)){try{return await next(spec+'.ts',ctx)}catch{}}
  return next(spec,ctx)}
