import {z} from 'zod';
import {requireUser,rawBindings,bindings,db,localDb,isDeveloper,ensureSchema,setRuntimeAiConfig,getRuntimeAiConfig,aiReady,youtubeReady,failure,json,AppError} from '@/lib/server';
import {getSupabaseConfig,setRuntimeSupabaseConfig,testSupabaseConnection,syncLocalToSupabase,detectSupabaseKeyType,maskSecretKey,normalizeSupabaseUrl} from '@/lib/supabase';

export type RegisteredUserItem={
 id:string;
 email:string;
 name:string;
 developer:boolean;
 hasPassword:boolean;
 google:boolean;
 tenantId:string;
 tenantName:string;
 grade:string;
 target:string;
 school:string;
 examYear:number;
 questionCount:number;
 examCount:number;
 hasPlan:boolean;
 createdAt:string;
 lastLoginAt:string|null;
};

async function listRegisteredUsers():Promise<RegisteredUserItem[]>{
 try{
  const database=db();
  const [uRes,pRes,tRes,qRes,eRes,plRes]=await Promise.all([
   database.prepare('SELECT id,email,name,password_hash,google_sub,tenant_id,created_at,last_login_at FROM users ORDER BY created_at DESC').all().catch(()=>({results:[]})),
   database.prepare('SELECT user_id,name,grade,target,school,exam_year FROM profiles').all().catch(()=>({results:[]})),
   database.prepare('SELECT id,name FROM tenants').all().catch(()=>({results:[]})),
   database.prepare('SELECT id,user_id FROM questions').all().catch(()=>({results:[]})),
   database.prepare('SELECT id,user_id FROM exams').all().catch(()=>({results:[]})),
   database.prepare('SELECT user_id FROM study_plans').all().catch(()=>({results:[]}))
  ]);
  const uMap=new Map<string,Record<string,unknown>>();
  for(const r of (uRes.results||[]) as Record<string,unknown>[]){
   if(r?.id)uMap.set(String(r.id),r);
  }
  const ld=localDb();
  if(ld){
   const lu=await ld.prepare('SELECT id,email,name,password_hash,google_sub,tenant_id,created_at,last_login_at FROM users ORDER BY created_at DESC').all().catch(()=>({results:[]}));
   for(const r of (lu.results||[]) as Record<string,unknown>[]){
    if(r?.id&&!uMap.has(String(r.id)))uMap.set(String(r.id),r);
   }
  }
  const profByOwner=new Map<string,Record<string,unknown>>();
  for(const p of (pRes.results||[]) as Record<string,unknown>[]){
   if(p?.user_id)profByOwner.set(String(p.user_id),p);
  }
  const tenantById=new Map<string,string>();
  for(const t of (tRes.results||[]) as Record<string,unknown>[]){
   if(t?.id)tenantById.set(String(t.id),String(t.name||''));
  }
  const qCount=new Map<string,number>();
  for(const q of (qRes.results||[]) as Record<string,unknown>[]){
   const k=String(q?.user_id||'');
   if(k)qCount.set(k,(qCount.get(k)||0)+1);
  }
  const eCount=new Map<string,number>();
  for(const ex of (eRes.results||[]) as Record<string,unknown>[]){
   const k=String(ex?.user_id||'');
   if(k)eCount.set(k,(eCount.get(k)||0)+1);
  }
  const planSet=new Set<string>();
  for(const pl of (plRes.results||[]) as Record<string,unknown>[]){
   if(pl?.user_id)planSet.add(String(pl.user_id));
  }
  const out:RegisteredUserItem[]=[];
  for(const u of uMap.values()){
   const id=String(u.id);
   const email=String(u.email||'');
   const tenantId=String(u.tenant_id||id);
   const prof=profByOwner.get(tenantId)||profByOwner.get(id)||{};
   const qc=(qCount.get(tenantId)||0)+(tenantId!==id?(qCount.get(id)||0):0);
   const ec=(eCount.get(tenantId)||0)+(tenantId!==id?(eCount.get(id)||0):0);
   out.push({
    id,
    email,
    name:String(u.name||prof.name||'Öğrenci'),
    developer:isDeveloper(email),
    hasPassword:!!u.password_hash,
    google:!!u.google_sub,
    tenantId,
    tenantName:tenantById.get(tenantId)||`${String(u.name||'Öğrenci')} Çalışma Alanı`,
    grade:String(prof.grade||'12'),
    target:String(prof.target||''),
    school:String(prof.school||''),
    examYear:Number(prof.exam_year||2026),
    questionCount:qc,
    examCount:ec,
    hasPlan:planSet.has(tenantId)||planSet.has(id),
    createdAt:String(u.created_at||''),
    lastLoginAt:u.last_login_at?String(u.last_login_at):null
   });
  }
  return out.sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''));
 }catch{
  return [];
 }
}

function aiStatusPayload(){
 const b=bindings();
 const rt=getRuntimeAiConfig();
 const raw=rawBindings();
 const key=b.OPENAI_API_KEY||'';
 const ytKey=b.YOUTUBE_API_KEY||'';
 const resendKey=b.RESEND_API_KEY||'';
 return {
  connected:aiReady(),
  source:rt.openaiKey?'runtime':raw.OPENAI_API_KEY?'env':'none',
  model:b.OPENAI_MODEL||'gpt-4o-mini',
  maskedKey:maskSecretKey(key),
  youtubeConnected:youtubeReady(),
  youtubeMaskedKey:maskSecretKey(ytKey),
  resendConnected:!!resendKey,
  resendMaskedKey:maskSecretKey(resendKey)
 };
}

export async function GET(req:Request){
 try{
  const me=await requireUser(req);
  if(!me.developer){
   throw new AppError('API bağlantı bilgilerine ve kullanıcı listesine yalnızca yetkili geliştirici (Developer) hesapları erişebilir.',403);
  }
  await ensureSchema();
  const cfg=getSupabaseConfig(rawBindings() as unknown as Record<string,unknown>);
  const ai=aiStatusPayload();
  const users=await listRegisteredUsers();
  if(!cfg){
   return Response.json({
    connected:false,
    url:'',
    maskedKey:'',
    keyType:'Yok',
    source:'none',
    tablesReady:false,
    authReady:false,
    tenantReady:false,
    message:'Supabase henüz bağlanmadı; kimlik doğrulama, tenant ve veriler yerel D1 (SQLite) veritabanında tutuluyor.',
    ai,
    users
   });
  }
  const status=await testSupabaseConnection(cfg.url,cfg.key);
  return Response.json({
   connected:status.ok,
   url:status.url||cfg.url,
   maskedKey:status.maskedKey||maskSecretKey(cfg.key),
   keyType:status.keyType||detectSupabaseKeyType(cfg.key),
   source:cfg.source,
   tablesReady:status.tablesReady,
   authReady:status.authReady,
   tenantReady:status.tenantReady,
   message:status.message,
   ai,
   users
  });
 }catch(e){return failure(e)}
}

export async function POST(req:Request){
 try{
  const me=await requireUser(req);
  if(!me.developer){
   throw new AppError('OpenAI, Supabase ve kullanıcı yönetimi işlemlerini yalnızca yetkili geliştirici (Developer) hesapları yapabilir.',403);
  }
  await ensureSchema();
  const body=await json(req) as Record<string,unknown>;
  const d=localDb();

  if(body?.action==='list_users'){
   return Response.json({ok:true,users:await listRegisteredUsers()});
  }

  // 1. OpenAI (+ isteğe bağlı YouTube ve Resend E-posta) API Bağlantısı
  if(body?.action==='save_openai'){
   const p=z.object({
    openaiKey:z.string().trim().min(8).max(500),
    openaiModel:z.string().trim().min(2).max(100).optional().default('gpt-4o-mini'),
    youtubeKey:z.string().trim().max(300).optional().default(''),
    resendKey:z.string().trim().max(300).optional().default('')
   }).safeParse(body);
   if(!p.success)throw new AppError('Geçerli bir OpenAI API anahtarı (sk-...) girin.');
   const cleanKey=p.data.openaiKey.trim().replace(/^['"]+|['"]+$/g,'').trim();
   const cleanModel=p.data.openaiModel.trim()||'gpt-4o-mini';
   const cleanYt=p.data.youtubeKey.trim().replace(/^['"]+|['"]+$/g,'').trim();
   const cleanResend=p.data.resendKey.trim().replace(/^['"]+|['"]+$/g,'').trim();

   // OpenAI anahtarını doğrula
   try{
    const testRes=await fetch('https://api.openai.com/v1/models',{
     headers:{Authorization:`Bearer ${cleanKey}`},
     signal:AbortSignal.timeout(12000)
    });
    if(testRes.status===401||testRes.status===403){
     throw new AppError('OpenAI API anahtarı geçersiz veya yetkisiz (HTTP 401). Lütfen sk-... anahtarını kontrol edin.',400);
    }
   }catch(e){
    if(e instanceof AppError)throw e;
   }

   for(const targetDb of [d,db()]){
    if(!targetDb)continue;
    try{
     const stmts=[
      targetDb.prepare("INSERT INTO sys_config (key,value) VALUES ('openai_api_key',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(cleanKey),
      targetDb.prepare("INSERT INTO sys_config (key,value) VALUES ('openai_model',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(cleanModel)
     ];
     if(cleanYt){
      stmts.push(targetDb.prepare("INSERT INTO sys_config (key,value) VALUES ('youtube_api_key',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(cleanYt));
     }
     if(cleanResend){
      stmts.push(targetDb.prepare("INSERT INTO sys_config (key,value) VALUES ('resend_api_key',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(cleanResend));
     }
     await targetDb.batch(stmts);
    }catch{}
   }
   const prev=getRuntimeAiConfig();
   setRuntimeAiConfig({
    openaiKey:cleanKey,
    openaiModel:cleanModel,
    youtubeKey:cleanYt||prev.youtubeKey,
    resendKey:cleanResend||prev.resendKey
   });
   const ai=aiStatusPayload();
   return Response.json({
    ok:true,
    ai,
    message:`OpenAI API (${cleanModel} · ${ai.maskedKey}) başarıyla bağlandı ve tüm yapay zekâ özellikleri aktif edildi!`
   });
  }

  if(body?.action==='disconnect_openai'){
   if(d){
    await d.prepare("DELETE FROM sys_config WHERE key IN ('openai_api_key','openai_model','youtube_api_key','resend_api_key')").run();
   }
   setRuntimeAiConfig(null);
   return Response.json({
    ok:true,
    ai:aiStatusPayload(),
    message:'OpenAI API bağlantısı kaldırıldı.'
   });
  }

  // 2. Supabase Veri Senkronizasyonu
  if(body?.action==='sync'){
   const cfg=getSupabaseConfig(rawBindings() as unknown as Record<string,unknown>);
   if(!cfg)throw new AppError('Önce Supabase bağlantısını kurun.',400);
   if(!d)throw new AppError('Yerel veritabanı bulunamadı.',500);
   const res=await syncLocalToSupabase(d,cfg);
   return Response.json({ok:true,synced:res.synced,tables:res.tables,message:`${res.synced} kayıt (kullanıcılar, tenant'lar ve çalışma verileri) Supabase PostgreSQL veritabanına senkronize edildi.`});
  }

  // 3. Supabase Bağlantısı Kurma / Güncelleme
  const p=z.object({url:z.string().trim().min(4).max(400),key:z.string().trim().min(10).max(2000)}).safeParse(body);
  if(!p.success)throw new AppError('Supabase Project URL (örn. https://xxxx.supabase.co) ve API anahtarını (service_role, anon, sb_secret_... veya sb_publishable_...) girin.');
  const cleanUrl=normalizeSupabaseUrl(p.data.url);
  const cleanKey=p.data.key.trim().replace(/^['"]+|['"]+$/g,'').trim();
  const status=await testSupabaseConnection(cleanUrl,cleanKey);
  if(!status.ok)throw new AppError(status.message,400);
  if(d){
   await d.batch([
    d.prepare("INSERT INTO sys_config (key,value) VALUES ('supabase_url',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(cleanUrl),
    d.prepare("INSERT INTO sys_config (key,value) VALUES ('supabase_key',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(cleanKey)
   ]);
  }
  setRuntimeSupabaseConfig({url:cleanUrl,key:cleanKey});
  let synced=0;
  if(status.tablesReady&&d){
   const s=await syncLocalToSupabase(d,{url:cleanUrl,key:cleanKey,source:'runtime'});
   synced=s.synced;
  }
  return Response.json({
   connected:true,
   url:cleanUrl,
   maskedKey:status.maskedKey,
   keyType:status.keyType,
   source:'runtime',
   tablesReady:status.tablesReady,
   authReady:status.authReady,
   tenantReady:status.tenantReady,
   synced,
   ai:aiStatusPayload(),
   users:await listRegisteredUsers(),
   message:status.tablesReady?`${status.message}${synced?` (${synced} yerel kayıt aktarıldı.)`:''}`:status.message
  });
 }catch(e){return failure(e)}
}

export async function DELETE(req:Request){
 try{
  const me=await requireUser(req);
  if(!me.developer)throw new AppError('Yalnızca yetkili geliştirici (Developer) hesapları bağlantıyı kaldırabilir.',403);
  await ensureSchema();
  const d=localDb();
  if(d){
   await d.prepare("DELETE FROM sys_config WHERE key IN ('supabase_url','supabase_key')").run();
  }
  setRuntimeSupabaseConfig(null);
  return Response.json({connected:false,url:'',maskedKey:'',keyType:'Yok',source:'none',tablesReady:false,authReady:false,tenantReady:false,ai:aiStatusPayload(),users:await listRegisteredUsers(),message:'Supabase bağlantısı kaldırıldı; yerel D1 veritabanına dönüldü.'});
 }catch(e){return failure(e)}
}
