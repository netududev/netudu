// Uzantısız göreli içe aktarmaları .ts'e çözer (node --experimental-strip-types için)
export async function resolve(spec,ctx,next){
  if(spec.startsWith('.')&&!/\.[a-z]+$/.test(spec)){try{return await next(spec+'.ts',ctx)}catch{}}
  return next(spec,ctx)}
