// Supabase Storage için saf yardımcılar (lib/supabase.ts'ten çağrılır; Node testlerinde tek başına yüklenir).
// Hatalar sessizce yutulmaz: yükleme başarısızsa StorageError (HTTP 502) fırlatılır, okuma boşsa null döner.
export const STORAGE_BUCKET='question-images';
type Cfg={url:string;key:string};
type Hdr=(extra?:Record<string,string>)=>Record<string,string>;
type FallbackBucket={put?:(k:string,v:any,o?:any)=>Promise<unknown>;get?:(k:string)=>Promise<any>}|null;

export class StorageError extends Error{
 status=502;
 detail:string;
 constructor(message:string,detail=''){super(message);this.name='StorageError';this.detail=detail}
}

const checked=new Set<string>();
export function resetBucketCache(){checked.clear()}

// Yanıttaki hata iletisi: en çok 200 karakter; anahtar, JWT ve proje adresi çıkarılır.
async function errorDetail(r:Response,cfg:Cfg):Promise<string>{
 let txt='';
 try{txt=await r.text()}catch{}
 try{const j=JSON.parse(txt) as Record<string,unknown>;txt=String(j.message||j.error_description||j.error||txt)}catch{}
 return scrub(txt,cfg).slice(0,200);
}
function scrub(s:string,cfg:Cfg):string{
 let out=String(s||'');
 for(const secret of [cfg.key,cfg.url,cfg.url.replace(/^https?:\/\//,'')])if(secret)out=out.split(secret).join('***');
 return out.replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,'***').replace(/sb_(?:secret|publishable)_[A-Za-z0-9_-]+/g,'***').replace(/\s+/g,' ').trim();
}
function fail(what:string,status:number|string,detail:string):StorageError{
 console.error('supabase_storage_failed',what,status,detail);
 return new StorageError(`${what} (${typeof status==='number'?'HTTP '+status:status}${detail?': '+detail:''}). Supabase anahtarını ve '${STORAGE_BUCKET}' bucket yetkisini kontrol et.`,detail);
}

// Bucket var/oluşturulmuşsa true döner ve önbelleğe alır; oluşturulamazsa StorageError fırlatır.
export async function ensureBucket(cfg:Cfg,hdr:Hdr,force=false):Promise<void>{
 const id=cfg.url+'|'+STORAGE_BUCKET;
 if(!force&&checked.has(id))return;
 if(!force){
  let r:Response|null=null;
  try{r=await fetch(`${cfg.url}/storage/v1/bucket/${STORAGE_BUCKET}`,{headers:hdr()})}catch{}
  if(r&&r.ok){checked.add(id);return}
  // Var mı bilinmiyor (yetki/ağ): önbelleğe alma, yüklemeyi dene; asıl hata orada raporlanır.
  if(!r||(r.status!==404&&r.status!==400))return;
 }
 let c:Response;
 try{c=await fetch(`${cfg.url}/storage/v1/bucket`,{method:'POST',headers:hdr(),body:JSON.stringify({id:STORAGE_BUCKET,name:STORAGE_BUCKET,public:false})})}
 catch(e){throw fail('Fotoğraf deposu (bucket) oluşturulamadı','ağ hatası',scrub((e as Error)?.message||'',cfg).slice(0,200))}
 if(c.ok||c.status===409){checked.add(id);return}
 throw fail('Fotoğraf deposu (bucket) oluşturulamadı',c.status,await errorDetail(c,cfg));
}

const objUrl=(cfg:Cfg,key:string)=>`${cfg.url}/storage/v1/object/${STORAGE_BUCKET}/${key.split('/').map(encodeURIComponent).join('/')}`;

export async function putObject(cfg:Cfg,hdr:Hdr,key:string,value:any,contentType:string,fallback:FallbackBucket):Promise<void>{
 await ensureBucket(cfg,hdr);
 const upload=()=>fetch(objUrl(cfg,key),{method:'POST',headers:hdr({'Content-Type':contentType,'x-upsert':'true'}),body:value as BodyInit});
 let r:Response;
 try{r=await upload()}catch(e){throw fail('Fotoğraf depoya yazılamadı','ağ hatası',scrub((e as Error)?.message||'',cfg).slice(0,200))}
 if(!r.ok&&(r.status===404||r.status===400)){
  const d=await errorDetail(r,cfg);
  if(/bucket not found|not found/i.test(d)){
   checked.delete(cfg.url+'|'+STORAGE_BUCKET);
   await ensureBucket(cfg,hdr,true);
   try{r=await upload()}catch(e){throw fail('Fotoğraf depoya yazılamadı','ağ hatası',scrub((e as Error)?.message||'',cfg).slice(0,200))}
  }else throw fail('Fotoğraf depoya yazılamadı',r.status,d);
 }
 if(!r.ok)throw fail('Fotoğraf depoya yazılamadı',r.status,await errorDetail(r,cfg));
 if(fallback?.put){try{await fallback.put(key,value,{httpMetadata:{contentType}})}catch{}}
}

// R2ObjectBody uyumlu nesne: gövde bir kez okunur, body ve arrayBuffer() ondan türetilir.
export function toObjectBody(buf:ArrayBuffer,contentType?:string|null,key?:string){
 const copy=()=>buf.slice(0);
 return {
  key,
  size:buf.byteLength,
  httpMetadata:{contentType:contentType||undefined},
  get body(){return new Blob([copy()]).stream()},
  bodyUsed:false,
  async arrayBuffer(){return copy()},
  async text(){return new TextDecoder().decode(buf)},
  async blob(){return new Blob([copy()],contentType?{type:contentType}:undefined)}
 };
}

async function fromFallback(fallback:FallbackBucket,key:string){
 if(!fallback?.get)return null;
 try{
  const o=await fallback.get(key);
  if(!o)return null;
  if(typeof o.arrayBuffer==='function'&&o.httpMetadata)return o;
  const buf=typeof o.arrayBuffer==='function'?await o.arrayBuffer():await new Response(o.body).arrayBuffer();
  return toObjectBody(buf,o.httpMetadata?.contentType,key);
 }catch{return null}
}

export async function getObject(cfg:Cfg,hdr:Hdr,key:string,fallback:FallbackBucket){
 try{
  const h:Record<string,string>={...hdr()};
  delete h['Content-Type'];
  const r=await fetch(objUrl(cfg,key),{headers:h});
  if(r.ok)return toObjectBody(await r.arrayBuffer(),r.headers.get('content-type'),key);
  if(r.status!==404&&r.status!==400)console.error('supabase_storage_failed','get',r.status,await errorDetail(r,cfg));
 }catch(e){
  console.error('supabase_storage_failed','get','ağ hatası',scrub((e as Error)?.message||'',cfg).slice(0,200));
 }
 return fromFallback(fallback,key);
}
