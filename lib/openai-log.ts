// OpenAI HTTP hatalarının güvenli günlüğü: yalnız HTTP durumu ile error.code / error.type yazılır.
// Anahtar, istem, görsel ve hata iletisi (message) ASLA günlüğe girmez.
const safe=(v:unknown)=>typeof v==='string'?v.replace(/[^\w.\-]/g,'').slice(0,60):'';
export function logOpenAiFailure(status:number,body:unknown){
 const e=(body&&typeof body==='object'?(body as {error?:{code?:unknown;type?:unknown}}).error:undefined)||{};
 console.error('openai_request_failed',`status=${Number(status)||0}`,`code=${safe(e.code)||'-'}`,`type=${safe(e.type)||'-'}`);
}
