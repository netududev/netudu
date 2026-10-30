// Supabase (PostgreSQL PostgREST + Supabase Storage + Supabase Auth + Multi-Tenant) arka uç bağdaştırıcısı.
// SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY (veya SUPABASE_ANON_KEY) tanımlandığında tüm veritabanı
// sorgularını, kimlik doğrulama (Authentication) işlemlerini, çoklu çalışma alanı (Tenant) yönetimini
// ve soru fotoğrafı depolamasını Supabase üzerinden çalıştırır; yerel D1 ile senkronize tutar.

export type SupabaseConfig={url:string;key:string;source:'env'|'runtime'};

export function normalizeSupabaseUrl(raw:string):string{
 const s=(raw||'').trim().replace(/^['"]+|['"]+$/g,'').trim();
 if(!s)return '';
 const dash=/supabase\.(?:com|co)\/dashboard\/project\/([a-z0-9-]+)/i.exec(s);
 if(dash)return `https://${dash[1].toLowerCase()}.supabase.co`;
 if(/^[a-z0-9]{12,32}$/i.test(s))return `https://${s.toLowerCase()}.supabase.co`;
 const withProto=/^https?:\/\//i.test(s)?s:`https://${s}`;
 try{
  const u=new URL(withProto);
  return `${u.protocol}//${u.host}`;
 }catch{
  return withProto.replace(/\/+$/,'');
 }
}

export function isJwtKey(key:string):boolean{
 return /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test((key||'').trim());
}

export function detectSupabaseKeyType(key:string):string{
 const k=(key||'').trim();
 if(!k)return 'Yok';
 if(/^sb_secret_/i.test(k))return 'Secret Key (sb_secret · Tam Yetki)';
 if(/^sb_publishable_/i.test(k))return 'Publishable Key (sb_publishable)';
 if(isJwtKey(k)){
  try{
   const b64=k.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');
   const jsonStr=typeof atob==='function'?atob(b64):Buffer.from(b64,'base64').toString('utf8');
   const payload=JSON.parse(jsonStr) as {role?:string};
   if(payload.role==='service_role')return 'Service Role JWT (Tam Yetki)';
   if(payload.role==='anon')return 'Anon / Public JWT';
  }catch{}
  return 'Supabase JWT Anahtarı';
 }
 return 'Supabase API Anahtarı';
}

export function maskSecretKey(key:string):string{
 const k=(key||'').trim();
 if(!k)return '';
 if(k.length<=14)return `${k.slice(0,4)}...${k.slice(-3)}`;
 return `${k.slice(0,10)}...${k.slice(-6)}`;
}

const DEFAULT_SUPABASE_URL='https://jioxqgxdsmlsmijnmqzf.supabase.co';
const DEFAULT_SUPABASE_KEY='sb_publishable_qSLTaTAaDSdVgidXoECE_A_av5DBfZg';

let runtimeConfig:{url:string;key:string}|null=null;
let runtimeDisconnected=false;

export function setRuntimeSupabaseConfig(cfg:{url:string;key:string}|null){
 if(cfg&&cfg.url&&cfg.key){
  runtimeConfig={url:normalizeSupabaseUrl(cfg.url),key:cfg.key.trim()};
  runtimeDisconnected=false;
 }else{
  runtimeConfig=null;
  runtimeDisconnected=true;
 }
}

export function getSupabaseConfig(envObj?:Record<string,unknown>):SupabaseConfig|null{
 if(runtimeConfig?.url&&runtimeConfig?.key)return {...runtimeConfig,source:'runtime'};
 if(runtimeDisconnected)return null;
 const p=(typeof process!=='undefined'&&process.env?process.env:{}) as Record<string,string|undefined>;
 const e=(envObj||{}) as Record<string,string|undefined>;
 const url=normalizeSupabaseUrl(e.SUPABASE_URL||e.NEXT_PUBLIC_SUPABASE_URL||p.SUPABASE_URL||p.NEXT_PUBLIC_SUPABASE_URL||'');
 const key=(e.SUPABASE_SERVICE_ROLE_KEY||e.SUPABASE_KEY||e.SUPABASE_ANON_KEY||e.NEXT_PUBLIC_SUPABASE_ANON_KEY||p.SUPABASE_SERVICE_ROLE_KEY||p.SUPABASE_KEY||p.SUPABASE_ANON_KEY||p.NEXT_PUBLIC_SUPABASE_ANON_KEY||'').trim();
 if(url&&key)return {url,key,source:'env'};
 if(DEFAULT_SUPABASE_URL&&DEFAULT_SUPABASE_KEY)return {url:DEFAULT_SUPABASE_URL,key:DEFAULT_SUPABASE_KEY,source:'env'};
 return null;
}

export const SUPABASE_BUCKET_NAME='question-images';

function headers(cfg:SupabaseConfig,extra?:Record<string,string>):Record<string,string>{
 const base:Record<string,string>={
  apikey:cfg.key,
  'Content-Type':'application/json'
 };
 if(isJwtKey(cfg.key)){
  base.Authorization=`Bearer ${cfg.key}`;
 }
 return {
  ...base,
  ...(extra||{})
 };
}

async function restFetch(cfg:SupabaseConfig,path:string,init?:RequestInit){
 return fetch(`${cfg.url}/rest/v1/${path}`,{
  ...init,
  headers:{...headers(cfg),...((init?.headers as Record<string,string>)||{})}
 });
}

function encVal(v:unknown):string{
 if(v===null||v===undefined)return 'null';
 return encodeURIComponent(String(v));
}

export function slugifyTenant(input:string):string{
 const base=input
  .toLocaleLowerCase('tr')
  .replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s').replace(/ı/g,'i').replace(/ö/g,'o').replace(/ç/g,'c')
  .replace(/[^a-z0-9]+/g,'-')
  .replace(/^-+|-+$/g,'')
  .slice(0,40);
 return base||'calisma-alani';
}

// ============================================================================
// 1. SUPABASE AUTHENTICATION (/auth/v1/*)
// ============================================================================

export type SupabaseAuthUser={
 id:string;
 email:string;
 name:string;
 accessToken:string|null;
 refreshToken:string|null;
 tenantId?:string;
 metadata?:Record<string,unknown>;
};

// Supabase Auth üzerinde yeni kullanıcı kaydeder (/auth/v1/admin/users veya /auth/v1/signup) ve oturum belirteci üretir.
export async function supabaseAuthSignUp(
 cfg:SupabaseConfig,
 input:{email:string;password:string;name:string;grade?:string;tenantName?:string}
):Promise<{user:SupabaseAuthUser|null;error?:string;duplicate?:boolean}>{
 const metadata={
  name:input.name,
  grade:input.grade||'12',
  tenant_name:input.tenantName||`${input.name} Çalışma Alanı`
 };
 try{
  // Önce service_role ile admin/users üzerinden e-posta onaylı (auto-confirm) oluşturmayı deneriz
  const adminRes=await fetch(`${cfg.url}/auth/v1/admin/users`,{
   method:'POST',
   headers:headers(cfg),
   body:JSON.stringify({
    email:input.email,
    password:input.password,
    email_confirm:true,
    user_metadata:metadata
   })
  });
  if(adminRes.ok){
   const created=await adminRes.json() as {id:string;email?:string;user_metadata?:Record<string,unknown>};
   // Hemen ardından /auth/v1/token?grant_type=password ile gerçek Supabase JWT oturumu alalım
   const loginRes=await supabaseAuthSignIn(cfg,{email:input.email,password:input.password});
   return {
    user:{
     id:created.id,
     email:created.email||input.email,
     name:input.name,
     accessToken:loginRes.user?.accessToken||null,
     refreshToken:loginRes.user?.refreshToken||null,
     metadata:created.user_metadata||metadata
    }
   };
  }
  if(adminRes.status===422||adminRes.status===409){
   const errBody=await adminRes.text().catch(()=>'');
   if(/already|registered|exists|duplicate/i.test(errBody)){
    return {user:null,duplicate:true,error:'Bu e-posta adresiyle Supabase üzerinde zaten bir hesap var.'};
   }
  }
  // Eğer anahtar service_role değilse (anon key ise) standart /auth/v1/signup uç noktasını kullanırız
  const signUpRes=await fetch(`${cfg.url}/auth/v1/signup`,{
   method:'POST',
   headers:headers(cfg),
   body:JSON.stringify({
    email:input.email,
    password:input.password,
    data:metadata
   })
  });
  const data=await signUpRes.json().catch(()=>({})) as Record<string,any>;
  if(!signUpRes.ok){
   const msg=String(data?.msg||data?.error_description||data?.message||'');
   if(/already|registered|exists/i.test(msg)){
    return {user:null,duplicate:true,error:'Bu e-posta adresiyle Supabase üzerinde zaten bir hesap var.'};
   }
   return {user:null,error:msg||`Supabase Auth HTTP ${signUpRes.status}`};
  }
  const u=data.user||data;
  if(!u?.id)return {user:null,error:'Supabase Auth kullanıcı kimliği döndürmedi.'};
  return {
   user:{
    id:String(u.id),
    email:String(u.email||input.email),
    name:String(u.user_metadata?.name||input.name),
    accessToken:data.access_token?String(data.access_token):null,
    refreshToken:data.refresh_token?String(data.refresh_token):null,
    metadata:u.user_metadata||metadata
   }
  };
 }catch(e){
  return {user:null,error:(e as Error).message};
 }
}

// Supabase Auth ile e-posta + şifre girişi (/auth/v1/token?grant_type=password)
export async function supabaseAuthSignIn(
 cfg:SupabaseConfig,
 input:{email:string;password:string}
):Promise<{user:SupabaseAuthUser|null;error?:string;invalidCredentials?:boolean}>{
 try{
  const r=await fetch(`${cfg.url}/auth/v1/token?grant_type=password`,{
   method:'POST',
   headers:headers(cfg),
   body:JSON.stringify({email:input.email,password:input.password})
  });
  const data=await r.json().catch(()=>({})) as Record<string,any>;
  if(!r.ok){
   const msg=String(data?.error_description||data?.msg||data?.message||'');
   const invalid=r.status===400||r.status===401||/invalid login|invalid_grant/i.test(msg);
   return {user:null,invalidCredentials:invalid,error:msg||`Supabase Auth HTTP ${r.status}`};
  }
  const u=data.user||{};
  if(!u.id)return {user:null,error:'Supabase Auth oturumu açılamadı.'};
  return {
   user:{
    id:String(u.id),
    email:String(u.email||input.email),
    name:String(u.user_metadata?.name||u.email?.split('@')[0]||'Öğrenci'),
    accessToken:data.access_token?String(data.access_token):null,
    refreshToken:data.refresh_token?String(data.refresh_token):null,
    tenantId:u.user_metadata?.tenant_id?String(u.user_metadata.tenant_id):undefined,
    metadata:u.user_metadata||{}
   }
  };
 }catch(e){
  return {user:null,error:(e as Error).message};
 }
}

// Supabase Auth JWT doğrulama (/auth/v1/user) ve gerekirse refresh_token ile yenileme
export async function supabaseAuthGetUser(
 cfg:SupabaseConfig,
 accessToken:string,
 refreshToken?:string|null
):Promise<{user:SupabaseAuthUser|null;refreshed?:boolean}>{
 try{
  const r=await fetch(`${cfg.url}/auth/v1/user`,{
   headers:{apikey:cfg.key,Authorization:`Bearer ${accessToken}`}
  });
  if(r.ok){
   const u=await r.json() as Record<string,any>;
   if(u?.id){
    return {
     user:{
      id:String(u.id),
      email:String(u.email||''),
      name:String(u.user_metadata?.name||u.email?.split('@')[0]||'Öğrenci'),
      accessToken,
      refreshToken:refreshToken||null,
      tenantId:u.user_metadata?.tenant_id?String(u.user_metadata.tenant_id):undefined,
      metadata:u.user_metadata||{}
     }
    };
   }
  }
  if(refreshToken){
   const rr=await fetch(`${cfg.url}/auth/v1/token?grant_type=refresh_token`,{
    method:'POST',
    headers:headers(cfg),
    body:JSON.stringify({refresh_token:refreshToken})
   });
   if(rr.ok){
    const d=await rr.json() as Record<string,any>;
    const u=d.user||{};
    if(u.id&&d.access_token){
     return {
      refreshed:true,
      user:{
       id:String(u.id),
       email:String(u.email||''),
       name:String(u.user_metadata?.name||u.email?.split('@')[0]||'Öğrenci'),
       accessToken:String(d.access_token),
       refreshToken:d.refresh_token?String(d.refresh_token):refreshToken,
       tenantId:u.user_metadata?.tenant_id?String(u.user_metadata.tenant_id):undefined,
       metadata:u.user_metadata||{}
      }
     };
    }
   }
  }
  return {user:null};
 }catch{
  return {user:null};
 }
}

// Supabase Auth üzerinde kullanıcı profil / sınıf (user_metadata) bilgilerini günceller
export async function supabaseAuthUpdateProfile(
 cfg:SupabaseConfig,
 userId:string,
 accessToken:string|null|undefined,
 profileData:Record<string,unknown>
):Promise<boolean>{
 try{
  if(accessToken){
   const r=await fetch(`${cfg.url}/auth/v1/user`,{
    method:'PUT',
    headers:{apikey:cfg.key,Authorization:`Bearer ${accessToken}`,'Content-Type':'application/json'},
    body:JSON.stringify({data:profileData})
   });
   if(r.ok)return true;
  }
  const ar=await fetch(`${cfg.url}/auth/v1/admin/users/${encodeURIComponent(userId)}`,{
   method:'PUT',
   headers:headers(cfg),
   body:JSON.stringify({user_metadata:profileData})
  });
  return ar.ok;
 }catch{
  return false;
 }
}

// Supabase Auth üzerinde kullanıcı şifresini günceller
export async function supabaseAuthUpdatePassword(
 cfg:SupabaseConfig,
 userId:string,
 accessToken:string|null|undefined,
 newPassword:string
):Promise<boolean>{
 try{
  if(accessToken){
   const r=await fetch(`${cfg.url}/auth/v1/user`,{
    method:'PUT',
    headers:{apikey:cfg.key,Authorization:`Bearer ${accessToken}`,'Content-Type':'application/json'},
    body:JSON.stringify({password:newPassword})
   });
   if(r.ok)return true;
  }
  const ar=await fetch(`${cfg.url}/auth/v1/admin/users/${encodeURIComponent(userId)}`,{
   method:'PUT',
   headers:headers(cfg),
   body:JSON.stringify({password:newPassword})
  });
  return ar.ok;
 }catch{
  return false;
 }
}

// Supabase Auth oturumunu kapatır (/auth/v1/logout)
export async function supabaseAuthLogout(cfg:SupabaseConfig,accessToken:string|null|undefined):Promise<void>{
 if(!accessToken)return;
 try{
  await fetch(`${cfg.url}/auth/v1/logout`,{
   method:'POST',
   headers:{apikey:cfg.key,Authorization:`Bearer ${accessToken}`}
  });
 }catch{}
}

// Supabase Auth kullanıcısını siler (/auth/v1/admin/users/{id})
export async function supabaseAuthDeleteUser(cfg:SupabaseConfig,userId:string):Promise<void>{
 try{
  await fetch(`${cfg.url}/auth/v1/admin/users/${encodeURIComponent(userId)}`,{
   method:'DELETE',
   headers:headers(cfg)
  });
 }catch{}
}

// Supabase OAuth yönlendirme URL'si (/auth/v1/authorize?provider=google)
export function supabaseOAuthUrl(cfg:SupabaseConfig,provider:'google',redirectTo:string):string{
 return `${cfg.url}/auth/v1/authorize?provider=${provider}&redirect_to=${encodeURIComponent(redirectTo)}`;
}

// ============================================================================
// 2. MULTI-TENANT (ÇOKLU ÇALIŞMA ALANI / KURUM) YÖNETİMİ
// ============================================================================

export type TenantSummary={
 id:string;
 name:string;
 slug:string;
 role:'owner'|'admin'|'member';
 plan:string;
 ownerId:string;
 createdAt:string;
};

export type TenantMemberInfo={
 userId:string;
 email:string;
 name:string;
 role:'owner'|'admin'|'member';
 createdAt:string;
};

// Kullanıcının kişisel/varsayılan tenant kaydının ve üyeliğinin varlığını garanti eder.
export async function ensureUserTenant(
 database:D1Database,
 input:{userId:string;name:string;email?:string;tenantName?:string}
):Promise<{tenantId:string;tenantName:string;tenantRole:'owner'|'admin'|'member'}>{
 const now=new Date().toISOString();
 const uRow=await database.prepare('SELECT id,tenant_id,name FROM users WHERE id=?').bind(input.userId).first();
 let activeTenantId=uRow?.tenant_id?String(uRow.tenant_id):input.userId;

 // Kullanıcının kendi varsayılan tenant'ı (id = userId) yoksa oluştur
 const ownTenant=await database.prepare('SELECT id,name,slug FROM tenants WHERE id=?').bind(input.userId).first();
 const defaultName=(input.tenantName||`${input.name||'Öğrenci'} Çalışma Alanı`).trim().slice(0,80);
 if(!ownTenant){
  const slug=`${slugifyTenant(defaultName)}-${input.userId.slice(0,6).toLowerCase()}`;
  await database.prepare('INSERT INTO tenants (id,name,slug,owner_id,plan,created_at) VALUES (?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING')
   .bind(input.userId,defaultName,slug,input.userId,'free',now).run();
 }
 await database.prepare('INSERT INTO tenant_members (tenant_id,user_id,role,created_at) VALUES (?,?,?,?) ON CONFLICT(tenant_id,user_id) DO NOTHING')
  .bind(input.userId,input.userId,'owner',now).run();

 // Aktif tenant'ta üyeliği var mı kontrol et; yoksa kendi tenant'ına dön
 const mem=await database.prepare('SELECT role FROM tenant_members WHERE tenant_id=? AND user_id=?').bind(activeTenantId,input.userId).first();
 let role:('owner'|'admin'|'member')='owner';
 if(!mem){
  activeTenantId=input.userId;
 }else{
  role=(String(mem.role||'member') as 'owner'|'admin'|'member');
 }
 if(!uRow?.tenant_id||String(uRow.tenant_id)!==activeTenantId){
  await database.prepare('UPDATE users SET tenant_id=? WHERE id=?').bind(activeTenantId,input.userId).run();
 }
 const tRow=await database.prepare('SELECT name FROM tenants WHERE id=?').bind(activeTenantId).first();
 return {
  tenantId:activeTenantId,
  tenantName:String(tRow?.name||defaultName),
  tenantRole:role
 };
}

// Kullanıcının üyesi olduğu tüm tenant'ları ve aktif tenant bilgisini döndürür
export async function listUserTenants(database:D1Database,userId:string,activeTenantId:string):Promise<{active:TenantSummary;tenants:TenantSummary[]}>{
 await ensureUserTenant(database,{userId,name:'Öğrenci'});
 const memRows=((await database.prepare('SELECT tenant_id,role,created_at FROM tenant_members WHERE user_id=? ORDER BY created_at ASC').bind(userId).all()).results||[]) as {tenant_id:string;role:string;created_at:string}[];
 const out:TenantSummary[]=[];
 for(const m of memRows){
  const t=await database.prepare('SELECT id,name,slug,owner_id,plan,created_at FROM tenants WHERE id=?').bind(m.tenant_id).first();
  if(t){
   out.push({
    id:String(t.id),
    name:String(t.name),
    slug:String(t.slug),
    role:(m.role as 'owner'|'admin'|'member')||'member',
    plan:String(t.plan||'free'),
    ownerId:String(t.owner_id),
    createdAt:String(t.created_at||m.created_at)
   });
  }
 }
 const active=out.find(x=>x.id===activeTenantId)||out[0]||{
  id:userId,
  name:'Kişisel Çalışma Alanı',
  slug:'kisisel',
  role:'owner',
  plan:'free',
  ownerId:userId,
  createdAt:new Date().toISOString()
 };
 return {active,tenants:out};
}

// Aktif tenant içindeki üyeleri listeler
export async function listTenantMembers(database:D1Database,tenantId:string):Promise<TenantMemberInfo[]>{
 const memRows=((await database.prepare('SELECT user_id,role,created_at FROM tenant_members WHERE tenant_id=? ORDER BY created_at ASC').bind(tenantId).all()).results||[]) as {user_id:string;role:string;created_at:string}[];
 const out:TenantMemberInfo[]=[];
 for(const m of memRows){
  const u=await database.prepare('SELECT id,email,name FROM users WHERE id=?').bind(m.user_id).first();
  if(u){
   out.push({
    userId:String(u.id),
    email:String(u.email),
    name:String(u.name),
    role:(m.role as 'owner'|'admin'|'member')||'member',
    createdAt:String(m.created_at)
   });
  }
 }
 return out;
}

// ============================================================================
// 3. POSTGREST SORGULARI (/rest/v1/*)
// ============================================================================

// Uygulamanın D1 SQL sorgularını Supabase PostgREST (/rest/v1) çağrılarına çevirir.
async function executeOnSupabase(cfg:SupabaseConfig,rawSql:string,params:unknown[],mode:'first'|'all'|'run'):Promise<{results:Record<string,unknown>[];meta:{changes:number}}|null>{
 const sql=rawSql.trim().replace(/\s+/g,' ');
 // Şema / PRAGMA sorguları PostgREST üzerinden değil SQL Editor ile yönetilir
 if(/^(CREATE|ALTER|DROP|PRAGMA)\b/i.test(sql))return {results:[],meta:{changes:0}};

 // 1. Özel oturum birleştirme sorgusu (sessions JOIN users)
 if(/FROM sessions s JOIN users u/i.test(sql)){
  const [sid,nowIso]=params;
  const sr=await restFetch(cfg,`sessions?id=eq.${encVal(sid)}&expires_at=gt.${encVal(nowIso)}&select=user_id,tenant_id,sb_access_token,sb_refresh_token&limit=1`);
  if(!sr.ok){
   // Eski şema uyumluluğu (tenant_id sütunu henüz eklenmemişse)
   const srFallback=await restFetch(cfg,`sessions?id=eq.${encVal(sid)}&expires_at=gt.${encVal(nowIso)}&select=user_id&limit=1`);
   if(!srFallback.ok)return null;
   const srowsFallback=await srFallback.json() as {user_id:string}[];
   if(!srowsFallback.length)return {results:[],meta:{changes:0}};
   const uid=srowsFallback[0].user_id;
   const [ur,fr]=await Promise.all([
    restFetch(cfg,`users?id=eq.${encVal(uid)}&select=id,email,name,password_hash,google_sub&limit=1`),
    restFetch(cfg,'users?select=id&order=created_at.asc,id.asc&limit=1')
   ]);
   if(!ur.ok)return null;
   const urows=await ur.json() as Record<string,unknown>[];
   if(!urows.length)return {results:[],meta:{changes:0}};
   const frows=fr.ok?(await fr.json() as {id:string}[]):[];
   const first=frows.length>0&&frows[0].id===urows[0].id?1:0;
   return {results:[{...urows[0],first}],meta:{changes:0}};
  }
  const srows=await sr.json() as {user_id:string;tenant_id?:string|null;sb_access_token?:string|null;sb_refresh_token?:string|null}[];
  if(!srows.length)return {results:[],meta:{changes:0}};
  const sess=srows[0];
  const uid=sess.user_id;
  const [ur,fr]=await Promise.all([
   restFetch(cfg,`users?id=eq.${encVal(uid)}&select=id,email,name,password_hash,google_sub,tenant_id&limit=1`),
   restFetch(cfg,'users?select=id&order=created_at.asc,id.asc&limit=1')
  ]);
  if(!ur.ok)return null;
  const urows=await ur.json() as Record<string,unknown>[];
  if(!urows.length)return {results:[],meta:{changes:0}};
  const frows=fr.ok?(await fr.json() as {id:string}[]):[];
  const first=frows.length>0&&frows[0].id===urows[0].id?1:0;
  return {
   results:[{
    ...urows[0],
    session_tenant_id:sess.tenant_id||null,
    sb_access_token:sess.sb_access_token||null,
    sb_refresh_token:sess.sb_refresh_token||null,
    first
   }],
   meta:{changes:0}
  };
 }

 // 2. SELECT COUNT(*) AS n FROM users
 if(/^SELECT COUNT\(\*\)\s+AS\s+n\s+FROM\s+users$/i.test(sql)){
  const r=await restFetch(cfg,'users?select=id',{headers:{Prefer:'count=exact'}});
  if(!r.ok)return null;
  const range=r.headers.get('content-range')||'';
  const m=/\/(\d+)$/.exec(range);
  const rows=await r.json() as unknown[];
  const n=m?Number(m[1]):rows.length;
  return {results:[{n}],meta:{changes:0}};
 }

 // 3. auth_attempts upsert (kaba kuvvet sayacı)
 if(/^INSERT INTO auth_attempts/i.test(sql)){
  const [key,resetIso,nowIso]=params as [string,string,string];
  const gr=await restFetch(cfg,`auth_attempts?key=eq.${encVal(key)}&select=count,reset_at&limit=1`);
  if(!gr.ok)return null;
  const existing=(await gr.json() as {count:number;reset_at:string}[])[0];
  const expired=!existing||existing.reset_at<nowIso;
  const body={key,count:expired?1:Number(existing.count||0)+1,reset_at:expired?resetIso:existing.reset_at};
  const ur=await restFetch(cfg,'auth_attempts?on_conflict=key',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(body)});
  return ur.ok?{results:[],meta:{changes:1}}:null;
 }

 // 4. ai_usage artırma / azaltma
 if(/^INSERT INTO ai_usage/i.test(sql)){
  const [user_id,day,kind,limit]=params as [string,string,string,number];
  const gr=await restFetch(cfg,`ai_usage?user_id=eq.${encVal(user_id)}&day=eq.${encVal(day)}&kind=eq.${encVal(kind)}&select=count&limit=1`);
  if(!gr.ok)return null;
  const existing=(await gr.json() as {count:number}[])[0];
  const cur=Number(existing?.count||0);
  if(existing&&cur>=Number(limit))return {results:[],meta:{changes:0}};
  const ur=await restFetch(cfg,'ai_usage?on_conflict=user_id,day,kind',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({user_id,day,kind,count:cur+1})});
  return ur.ok?{results:[],meta:{changes:1}}:null;
 }
 if(/^UPDATE ai_usage SET count=MAX\(count-1,0\)/i.test(sql)){
  const [user_id,day,kind]=params as [string,string,string];
  const gr=await restFetch(cfg,`ai_usage?user_id=eq.${encVal(user_id)}&day=eq.${encVal(day)}&kind=eq.${encVal(kind)}&select=count&limit=1`);
  if(!gr.ok)return null;
  const existing=(await gr.json() as {count:number}[])[0];
  if(!existing)return {results:[],meta:{changes:0}};
  const ur=await restFetch(cfg,`ai_usage?user_id=eq.${encVal(user_id)}&day=eq.${encVal(day)}&kind=eq.${encVal(kind)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({count:Math.max(0,Number(existing.count||0)-1)})});
  return ur.ok?{results:[],meta:{changes:1}}:null;
 }

 // 5. UPDATE OR IGNORE <table> SET user_id=? WHERE user_id NOT IN (SELECT id FROM users)
 if(/^UPDATE OR IGNORE\s+(\w+)\s+SET user_id=\?/i.test(sql)){
  return {results:[],meta:{changes:0}};
 }

 // 6. UPDATE questions SET analyzing_at=? WHERE id=? AND user_id=? AND (analyzing_at IS NULL OR analyzing_at < ?)
 if(/^UPDATE questions SET analyzing_at=\? WHERE id=\? AND user_id=\? AND \(analyzing_at IS NULL OR analyzing_at < \?\)$/i.test(sql)){
  const [analyzing_at,id,user_id,cutoff]=params;
  const r=await restFetch(cfg,`questions?id=eq.${encVal(id)}&user_id=eq.${encVal(user_id)}&or=(analyzing_at.is.null,analyzing_at.lt.${encVal(cutoff)})`,{
   method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({analyzing_at})
  });
  if(!r.ok)return null;
  const rows=await r.json() as Record<string,unknown>[];
  return {results:rows,meta:{changes:rows.length}};
 }

 // 7. Genel SELECT sorguları
 const selMatch=/^SELECT\s+(.+?)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+?))?(?:\s+ORDER BY\s+(.+?))?(?:\s+LIMIT\s+(\d+))?$/i.exec(sql);
 if(selMatch){
  const [,colsRaw,table,whereRaw,orderRaw,limitRaw]=selMatch;
  const q:string[]=[`select=${colsRaw.trim()==='*'?'*':colsRaw.replace(/\s+/g,'')}`];
  let pIdx=0;
  if(whereRaw){
   for(const cond of whereRaw.split(/\s+AND\s+/i)){
    const c=cond.trim();
    let m=/^(\w+)\s*=\s*\?$/.exec(c);
    if(m){q.push(`${m[1]}=eq.${encVal(params[pIdx++])}`);continue}
    m=/^(\w+)\s*<\s*\?$/.exec(c);
    if(m){q.push(`${m[1]}=lt.${encVal(params[pIdx++])}`);continue}
    m=/^(\w+)\s*>\s*\?$/.exec(c);
    if(m){q.push(`${m[1]}=gt.${encVal(params[pIdx++])}`);continue}
    m=/^(\w+)\s*<>\s*\?$/.exec(c);
    if(m){q.push(`${m[1]}=neq.${encVal(params[pIdx++])}`);continue}
    m=/^(\w+)\s+IS\s+NOT\s+NULL$/i.exec(c);
    if(m){q.push(`${m[1]}=not.is.null`);continue}
   }
  }
  if(orderRaw){
   const orders=orderRaw.split(',').map(o=>{
    const parts=o.trim().split(/\s+/);
    return `${parts[0]}.${(parts[1]||'asc').toLowerCase()}`;
   }).join(',');
   q.push(`order=${orders}`);
  }
  if(limitRaw)q.push(`limit=${limitRaw}`);
  else if(mode==='first')q.push('limit=1');
  const r=await restFetch(cfg,`${table}?${q.join('&')}`);
  if(!r.ok)return null;
  const rows=await r.json() as Record<string,unknown>[];
  return {results:rows,meta:{changes:0}};
 }

 // 8. Genel INSERT / INSERT OR IGNORE / ON CONFLICT sorguları
 const insMatch=/^INSERT\s+(?:OR\s+IGNORE\s+)?INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)(?:\s*ON\s+CONFLICT\s*\(([^)]+)\)\s*DO\s+(NOTHING|UPDATE\s+SET\s+.+))?$/i.exec(sql);
 if(insMatch){
  const isIgnore=/^INSERT\s+OR\s+IGNORE/i.test(sql);
  const [,table,colsStr,valsStr,conflictCols,conflictAction]=insMatch;
  const cols=colsStr.split(',').map(c=>c.trim());
  const valTokens=valsStr.split(',').map(v=>v.trim());
  const body:Record<string,unknown>={};
  let pIdx=0;
  for(let i=0;i<cols.length;i++){
   const tok=valTokens[i];
   if(tok==='?')body[cols[i]]=params[pIdx++]??null;
   else if(/^NULL$/i.test(tok))body[cols[i]]=null;
   else if(/^'\d+'$/.test(tok)||/^\d+$/.test(tok))body[cols[i]]=Number(tok.replace(/'/g,''));
   else if(/^'.*'$/.test(tok))body[cols[i]]=tok.slice(1,-1);
   else body[cols[i]]=params[pIdx++]??null;
  }
  const onConflict=conflictCols?conflictCols.replace(/\s+/g,''):isIgnore?(table==='reports'?'user_id,month':table==='profiles'||table==='study_plans'?'user_id':table==='tenant_members'?'tenant_id,user_id':'id'):'';
  const doNothing=isIgnore||(conflictAction&&/^NOTHING$/i.test(conflictAction.trim()));
  const query=onConflict?`${table}?on_conflict=${onConflict}`:table;
  const prefer=onConflict?(doNothing?'resolution=ignore-duplicates,return=minimal':'resolution=merge-duplicates,return=minimal'):'return=minimal';
  const r=await restFetch(cfg,query,{method:'POST',headers:{Prefer:prefer},body:JSON.stringify(body)});
  if(!r.ok){
   const errTxt=await r.text().catch(()=>'');
   if(r.status===409||/23505|duplicate key|unique/i.test(errTxt)){
    if(doNothing)return {results:[],meta:{changes:0}};
    throw new Error('UNIQUE constraint failed: '+errTxt);
   }
   return null;
  }
  return {results:[],meta:{changes:1}};
 }

 // 9. Genel UPDATE sorguları
 const updMatch=/^UPDATE\s+(\w+)\s+SET\s+(.+?)\s+WHERE\s+(.+)$/i.exec(sql);
 if(updMatch){
  const [,table,setRaw,whereRaw]=updMatch;
  const body:Record<string,unknown>={};
  let pIdx=0;
  for(const part of setRaw.split(',')){
   const [col,valExpr]=part.split('=').map(s=>s.trim());
   if(valExpr==='?')body[col]=params[pIdx++]??null;
   else if(/^NULL$/i.test(valExpr))body[col]=null;
   else if(/^\d+$/.test(valExpr))body[col]=Number(valExpr);
   else if(/^'.*'$/.test(valExpr))body[col]=valExpr.slice(1,-1);
  }
  const q:string[]=[];
  for(const cond of whereRaw.split(/\s+AND\s+/i)){
   const c=cond.trim();
   const m=/^(\w+)\s*=\s*\?$/.exec(c);
   if(m)q.push(`${m[1]}=eq.${encVal(params[pIdx++])}`);
  }
  const r=await restFetch(cfg,`${table}?${q.join('&')}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify(body)});
  if(!r.ok)return null;
  const rows=await r.json().catch(()=>[]) as Record<string,unknown>[];
  return {results:rows,meta:{changes:Array.isArray(rows)?rows.length:1}};
 }

 // 10. Genel DELETE sorguları
 const delMatch=/^DELETE\s+FROM\s+(\w+)\s+WHERE\s+(.+)$/i.exec(sql);
 if(delMatch){
  const [,table,whereRaw]=delMatch;
  const q:string[]=[];
  let pIdx=0;
  for(const cond of whereRaw.split(/\s+AND\s+/i)){
   const c=cond.trim();
   let m=/^(\w+)\s*=\s*\?$/.exec(c);
   if(m){q.push(`${m[1]}=eq.${encVal(params[pIdx++])}`);continue}
   m=/^(\w+)\s*<\s*\?$/.exec(c);
   if(m){q.push(`${m[1]}=lt.${encVal(params[pIdx++])}`);continue}
   m=/^(\w+)\s*<>\s*\?$/.exec(c);
   if(m){q.push(`${m[1]}=neq.${encVal(params[pIdx++])}`);continue}
  }
  const r=await restFetch(cfg,`${table}?${q.join('&')}`,{method:'DELETE',headers:{Prefer:'return=representation'}});
  if(!r.ok)return null;
  const rows=await r.json().catch(()=>[]) as Record<string,unknown>[];
  return {results:[],meta:{changes:Array.isArray(rows)?rows.length:1}};
 }

 return null;
}

// Yerel D1 yedeği yoksa (Vercel) Supabase hataları maskelenmez; sunucu günlüğüne yazılır.
function logSupabaseMiss(kind:string,sql:string,err?:unknown){
 console.error('supabase_query_failed',kind,sql.replace(/\s+/g,' ').slice(0,120),err instanceof Error?err.message:'(boş yanıt veya çevrilemeyen SQL)');
}

class SupabasePreparedStatement{
 private params:unknown[]=[];
 constructor(private cfg:SupabaseConfig,private fallback:D1Database|null,private sql:string){}
 bind(...values:unknown[]){
  const next=new SupabasePreparedStatement(this.cfg,this.fallback,this.sql);
  next.params=values;
  return next;
 }
 async first<T=Record<string,unknown>>():Promise<T|null>{
  let supaSucceeded=false;
  try{
   const res=await executeOnSupabase(this.cfg,this.sql,this.params,'first');
   if(res){
    supaSucceeded=true;
    if(res.results[0])return res.results[0] as T;
   }else if(!this.fallback)logSupabaseMiss('first',this.sql);
  }catch(e){
   if(/UNIQUE/i.test(String((e as Error)?.message)))throw e;
   if(!this.fallback)logSupabaseMiss('first',this.sql,e);
  }
  if(!supaSucceeded&&this.fallback){
   try{
    return (await this.fallback.prepare(this.sql).bind(...this.params).first()) as T|null;
   }catch{
    return null;
   }
  }
  return null;
 }
 async all<T=Record<string,unknown>>():Promise<{results:T[];success:boolean;meta:{changes:number}}>{
  let supaSucceeded=false;
  try{
   const res=await executeOnSupabase(this.cfg,this.sql,this.params,'all');
   if(res){
    supaSucceeded=true;
    if(res.results.length>0||!this.fallback)return {results:res.results as T[],success:true,meta:res.meta};
   }else if(!this.fallback)logSupabaseMiss('all',this.sql);
  }catch(e){
   if(/UNIQUE/i.test(String((e as Error)?.message)))throw e;
   if(!this.fallback)logSupabaseMiss('all',this.sql,e);
  }
  if(!supaSucceeded&&this.fallback){
   try{
    const r=await this.fallback.prepare(this.sql).bind(...this.params).all();
    return {results:(r.results||[]) as T[],success:true,meta:{changes:Number((r.meta as any)?.changes||0)}};
   }catch{
    return {results:[],success:true,meta:{changes:0}};
   }
  }
  return {results:[],success:true,meta:{changes:0}};
 }
 async run():Promise<{success:boolean;meta:{changes:number}}>{
  let supaRes:{results:Record<string,unknown>[];meta:{changes:number}}|null=null;
  let supaErr:Error|null=null;
  try{
   supaRes=await executeOnSupabase(this.cfg,this.sql,this.params,'run');
  }catch(e){
   supaErr=e as Error;
  }
  if(supaErr&&/UNIQUE/i.test(supaErr.message))throw supaErr;
  if(!this.fallback&&!supaRes)logSupabaseMiss('run',this.sql,supaErr);
  // Yerel D1'e de yaz (çift yönlü yerel yedek)
  if(this.fallback){
   try{
    const localRun=await this.fallback.prepare(this.sql).bind(...this.params).run();
    if(!supaRes)return {success:true,meta:{changes:Number((localRun.meta as any)?.changes||0)}};
   }catch(e){
    if(!supaRes)throw e;
   }
  }
  return {success:true,meta:{changes:supaRes?.meta.changes??0}};
 }
}

export function createSupabaseD1(cfg:SupabaseConfig,fallback:D1Database|null):D1Database{
 return {
  prepare(sql:string){
   return new SupabasePreparedStatement(cfg,fallback,sql) as unknown as D1PreparedStatement;
  },
  async batch<T=unknown>(statements:D1PreparedStatement[]){
   const out:D1Result<T>[]=[];
   for(const st of statements){
    const s=st as unknown as SupabasePreparedStatement;
    const isSelect=/^\s*SELECT\b/i.test((s as any).sql||'');
    if(isSelect){
     const r=await s.all<T>();
     out.push({results:r.results,success:true,meta:r.meta as any});
    }else{
     const r=await s.run();
     out.push({results:[],success:true,meta:r.meta as any});
    }
   }
   return out;
  },
  async exec(sql:string){
   if(fallback)return fallback.exec(sql);
   return {count:0,duration:0};
  },
  async dump(){
   if(fallback)return fallback.dump();
   return new ArrayBuffer(0);
  },
  withSession(){
   return this as unknown as D1DatabaseSession;
  }
 } as unknown as D1Database;
}

// Supabase Storage bağdaştırıcısı (R2Bucket uyumlu)
let bucketChecked=false;
async function ensureStorageBucket(cfg:SupabaseConfig){
 if(bucketChecked)return;
 try{
  const r=await fetch(`${cfg.url}/storage/v1/bucket/${SUPABASE_BUCKET_NAME}`,{headers:headers(cfg)});
  if(r.status===404||r.status===400){
   await fetch(`${cfg.url}/storage/v1/bucket`,{
    method:'POST',
    headers:headers(cfg),
    body:JSON.stringify({id:SUPABASE_BUCKET_NAME,name:SUPABASE_BUCKET_NAME,public:false})
   });
  }
  bucketChecked=true;
 }catch{}
}

export function createSupabaseBucket(cfg:SupabaseConfig,fallback:R2Bucket|null):R2Bucket{
 return {
  async put(key:string,value:Uint8Array|ArrayBuffer|ReadableStream|string,options?:{httpMetadata?:{contentType?:string}}){
   const contentType=options?.httpMetadata?.contentType||'application/octet-stream';
   await ensureStorageBucket(cfg);
   try{
    const encodedKey=key.split('/').map(encodeURIComponent).join('/');
    await fetch(`${cfg.url}/storage/v1/object/${SUPABASE_BUCKET_NAME}/${encodedKey}`,{
     method:'POST',
     headers:headers(cfg,{'Content-Type':contentType,'x-upsert':'true'}),
     body:value as BodyInit
    });
   }catch{}
   if(fallback){
    try{await fallback.put(key,value as any,options as any)}catch{}
   }
   return null as unknown as R2Object;
  },
  async get(key:string){
   try{
    const encodedKey=key.split('/').map(encodeURIComponent).join('/');
    const h:Record<string,string>={apikey:cfg.key};
    if(isJwtKey(cfg.key))h.Authorization=`Bearer ${cfg.key}`;
    const r=await fetch(`${cfg.url}/storage/v1/object/${SUPABASE_BUCKET_NAME}/${encodedKey}`,{
     headers:h
    });
    if(r.ok&&r.body){
     return {body:r.body} as unknown as R2ObjectBody;
    }
   }catch{}
   if(fallback)return fallback.get(key);
   return null;
  },
  async delete(keys:string|string[]){
   const list=Array.isArray(keys)?keys:[keys];
   try{
    await fetch(`${cfg.url}/storage/v1/object/${SUPABASE_BUCKET_NAME}`,{
     method:'DELETE',
     headers:headers(cfg),
     body:JSON.stringify({prefixes:list})
    });
   }catch{}
   if(fallback){
    try{await fallback.delete(keys as any)}catch{}
   }
  }
 } as unknown as R2Bucket;
}

// Supabase bağlantı testi ve tablo (Auth + Tenant + Veri) kontrolü
export async function testSupabaseConnection(url:string,key:string):Promise<{ok:boolean;url:string;keyType:string;maskedKey:string;tablesReady:boolean;authReady:boolean;tenantReady:boolean;message:string}>{
 const cleanUrl=normalizeSupabaseUrl(url);
 const cleanKey=(key||'').trim().replace(/^['"]+|['"]+$/g,'').trim();
 const keyType=detectSupabaseKeyType(cleanKey);
 const maskedKey=maskSecretKey(cleanKey);
 if(!cleanUrl||!/^https?:\/\/[a-z0-9.-]+/i.test(cleanUrl)){
  return {ok:false,url:cleanUrl,keyType,maskedKey,tablesReady:false,authReady:false,tenantReady:false,message:'Geçerli bir Supabase Project URL girin (örn. https://xyz.supabase.co).'};
 }
 if(!cleanKey||cleanKey.length<10){
  return {ok:false,url:cleanUrl,keyType,maskedKey,tablesReady:false,authReady:false,tenantReady:false,message:'Geçerli bir Supabase API Key (service_role, anon, sb_secret_... veya sb_publishable_...) girin.'};
 }
 const hPrimary:Record<string,string>=isJwtKey(cleanKey)
  ?{apikey:cleanKey,Authorization:`Bearer ${cleanKey}`}
  :{apikey:cleanKey};
 const hAlt:Record<string,string>=isJwtKey(cleanKey)
  ?{apikey:cleanKey}
  :{apikey:cleanKey,Authorization:`Bearer ${cleanKey}`};
 try{
  let [ar,tr,tnr]=await Promise.all([
   fetch(`${cleanUrl}/auth/v1/settings`,{headers:hPrimary,signal:AbortSignal.timeout(10000)}).catch(()=>null),
   fetch(`${cleanUrl}/rest/v1/users?select=id&limit=1`,{headers:hPrimary,signal:AbortSignal.timeout(10000)}).catch(()=>null),
   fetch(`${cleanUrl}/rest/v1/tenants?select=id&limit=1`,{headers:hPrimary,signal:AbortSignal.timeout(10000)}).catch(()=>null)
  ]);
  if((!ar||!ar.ok)&&(!tr||!tr.ok)){
   const [ar2,tr2,tnr2]=await Promise.all([
    fetch(`${cleanUrl}/auth/v1/settings`,{headers:hAlt,signal:AbortSignal.timeout(8000)}).catch(()=>null),
    fetch(`${cleanUrl}/rest/v1/users?select=id&limit=1`,{headers:hAlt,signal:AbortSignal.timeout(8000)}).catch(()=>null),
    fetch(`${cleanUrl}/rest/v1/tenants?select=id&limit=1`,{headers:hAlt,signal:AbortSignal.timeout(8000)}).catch(()=>null)
   ]);
   if(ar2?.ok||tr2?.ok){ar=ar2;tr=tr2;tnr=tnr2;}
  }
  if(!ar&&!tr&&!tnr){
   return {ok:false,url:cleanUrl,keyType,maskedKey,tablesReady:false,authReady:false,tenantReady:false,message:`Supabase sunucusuna (${cleanUrl}) ulaşılamadı. Project URL adresini kontrol edin.`};
  }
  const authUnauthorized=ar&&(ar.status===401||ar.status===403);
  const restUnauthorized=tr&&(tr.status===401||tr.status===403);
  if(authUnauthorized&&restUnauthorized){
   return {ok:false,url:cleanUrl,keyType,maskedKey,tablesReady:false,authReady:false,tenantReady:false,message:'Supabase API anahtarı geçersiz veya bu projeye ait değil (HTTP 401/403). Project Settings › API Keys ekranındaki anahtarı kontrol edin.'};
  }
  const authReady=!!ar?.ok;
  const usersReady=!!tr?.ok;
  const tenantReady=!!tnr?.ok;
  const tablesReady=usersReady&&tenantReady;
  if(!tablesReady){
   return {
    ok:true,
    url:cleanUrl,
    keyType,
    maskedKey,
    tablesReady:false,
    authReady,
    tenantReady,
    message:`Supabase bağlantısı başarıyla kuruldu! (${cleanUrl} · ${keyType}). Tabloları oluşturmak için "SQL şemasını kopyala" düğmesiyle şemayı Supabase SQL Editor içinde çalıştırabilirsin.`
   };
  }
  return {
   ok:true,
   url:cleanUrl,
   keyType,
   maskedKey,
   tablesReady:true,
   authReady,
   tenantReady:true,
   message:`Supabase Auth, Multi-Tenant (tenants & RLS), PostgreSQL ve Storage bağlantısı başarıyla aktif edildi! (${cleanUrl} · ${keyType})`
  };
 }catch(e){
  return {ok:false,url:cleanUrl,keyType,maskedKey,tablesReady:false,authReady:false,tenantReady:false,message:`Supabase sunucusuna ulaşılamadı: ${(e as Error).message}`};
 }
}

// Yerel D1 veritabanındaki tüm kayıtları (kullanıcılar, tenant'lar ve çalışma verileri) Supabase'e senkronize eder
export async function syncLocalToSupabase(localDb:D1Database,cfg:SupabaseConfig):Promise<{synced:number;tables:Record<string,number>}>{
 const specs:{table:string;conflict:string}[]=[
  {table:'tenants',conflict:'id'},
  {table:'users',conflict:'id'},
  {table:'tenant_members',conflict:'tenant_id,user_id'},
  {table:'profiles',conflict:'user_id'},
  {table:'study_plans',conflict:'user_id'},
  {table:'questions',conflict:'id'},
  {table:'exams',conflict:'id'},
  {table:'reports',conflict:'user_id,month'},
  {table:'study_notes',conflict:'user_id,subject,topic'},
  {table:'video_cache',conflict:'user_id,subject,topic'},
  {table:'sessions',conflict:'id'}
 ];
 let synced=0;
 const tables:Record<string,number>={};
 for(const {table,conflict} of specs){
  try{
   const rows=((await localDb.prepare(`SELECT * FROM ${table}`).all()).results||[]) as Record<string,unknown>[];
   if(!rows.length){tables[table]=0;continue}
   const r=await restFetch(cfg,`${table}?on_conflict=${conflict}`,{
    method:'POST',
    headers:{Prefer:'resolution=merge-duplicates,return=minimal'},
    body:JSON.stringify(rows)
   });
   if(r.ok){
    tables[table]=rows.length;
    synced+=rows.length;
   }else{
    tables[table]=0;
   }
  }catch{
   tables[table]=0;
  }
 }
 return {synced,tables};
}
