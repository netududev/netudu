// Hesap ve Multi-Tenant sistemi: Supabase Auth (/auth/v1) + yerel PBKDF2-SHA256 yedekli kimlik doğrulama,
// otomatik Tenant (çalışma alanı / kurum) oluşturma, oturum çerezi ve deneme sınırı.
import {db,bindings,activeSupabaseConfig,AppError,sha256,SESSION_COOKIE,SESSION_DAYS,ensureSchema} from './server';
import {supabaseAuthSignUp,supabaseAuthSignIn,ensureUserTenant} from './supabase';
import {profileFor,type Profile} from './study';

const ITERATIONS=100000;
const enc=new TextEncoder();
const b64url=(bytes:Uint8Array)=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const fromB64url=(s:string)=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')+'==='.slice((s.length+3)%4)),c=>c.charCodeAt(0));
export const randomToken=(bytes=32)=>b64url(crypto.getRandomValues(new Uint8Array(bytes)));

export async function hashPassword(password:string,salt=crypto.getRandomValues(new Uint8Array(16))){const key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);const bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations:ITERATIONS},key,256);return {hash:b64url(new Uint8Array(bits)),salt:b64url(salt)}}
export async function verifyPassword(password:string,hash:string,salt:string){const h=(await hashPassword(password,fromB64url(salt))).hash;if(h.length!==hash.length)return false;let diff=0;for(let i=0;i<h.length;i++)diff|=h.charCodeAt(i)^hash.charCodeAt(i);return diff===0}

export const normalizeEmail=(e:string)=>e.trim().toLowerCase();
export const validEmail=(e:string)=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)&&e.length<=200;
export function checkPassword(p:string){if(p.length<8)throw new AppError('Şifre en az 8 karakter olmalı.');if(p.length>200)throw new AppError('Şifre çok uzun.');if(!/[A-Za-zÇĞİÖŞÜçğıöşü]/.test(p)||!/\d/.test(p))throw new AppError('Şifrede en az bir harf ve bir rakam olmalı.')}

// Oturum: rastgele belirteç çerezde, özeti + aktif tenant_id + Supabase Auth JWT belirteçleri veritabanında. 30 gün geçerli.
export async function createSession(
 request:Request,
 userId:string,
 opts?:{tenantId?:string|null;sbAccessToken?:string|null;sbRefreshToken?:string|null}
){
 const token=randomToken();
 const now=new Date();
 const expires=new Date(now.getTime()+SESSION_DAYS*86400000);
 const uRow=await db().prepare('SELECT tenant_id,name,email FROM users WHERE id=?').bind(userId).first();
 const tInfo=await ensureUserTenant(db(),{
  userId,
  name:String(uRow?.name||'Öğrenci'),
  email:uRow?.email?String(uRow.email):undefined
 });
 const tenantId=opts?.tenantId||tInfo.tenantId||userId;
 await db().batch([
  db().prepare('INSERT INTO sessions (id,user_id,tenant_id,sb_access_token,sb_refresh_token,created_at,expires_at,user_agent) VALUES (?,?,?,?,?,?,?,?)').bind(
   await sha256(token),
   userId,
   tenantId,
   opts?.sbAccessToken||null,
   opts?.sbRefreshToken||null,
   now.toISOString(),
   expires.toISOString(),
   (request.headers.get('user-agent')||'').slice(0,200)
  ),
  db().prepare('UPDATE users SET last_login_at=?,tenant_id=? WHERE id=?').bind(now.toISOString(),tenantId,userId),
  db().prepare('DELETE FROM sessions WHERE user_id=? AND expires_at<?').bind(userId,now.toISOString())
 ]);
 return sessionCookie(request,token,SESSION_DAYS*86400);
}

export function sessionCookie(request:Request,token:string,maxAge:number){const secure=new URL(request.url).protocol==='https:'?'; Secure':'';return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`}
export const clearSessionCookie=(request:Request)=>sessionCookie(request,'',0);

// Kaba kuvvet koruması: anahtar başına pencere içinde en fazla N deneme.
export async function throttleCheck(key:string,max:number){const row=await db().prepare('SELECT count,reset_at FROM auth_attempts WHERE key=?').bind(key).first();if(row&&String(row.reset_at)>new Date().toISOString()&&Number(row.count)>=max)throw new AppError('Çok fazla deneme yapıldı. 15 dakika sonra tekrar dene.',429)}
export async function throttleHit(key:string,minutes=15){const now=new Date();const reset=new Date(now.getTime()+minutes*60000).toISOString();await db().prepare('INSERT INTO auth_attempts (key,count,reset_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN auth_attempts.reset_at<? THEN 1 ELSE auth_attempts.count+1 END, reset_at=CASE WHEN auth_attempts.reset_at<? THEN excluded.reset_at ELSE auth_attempts.reset_at END').bind(key,reset,now.toISOString(),now.toISOString()).run()}
export const throttleClear=(key:string)=>db().prepare('DELETE FROM auth_attempts WHERE key=?').bind(key).run();
export const clientIp=(r:Request)=>r.headers.get('cf-connecting-ip')||r.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'local';

export const registrationOpen=()=>bindings().REGISTRATION_OPEN!=='false';
export const appOrigin=(req:Request)=>(bindings().APP_URL||new URL(req.url).origin).replace(/\/$/,'');
export const googleReady=()=>!!(bindings().GOOGLE_CLIENT_ID&&bindings().GOOGLE_CLIENT_SECRET)||!!activeSupabaseConfig();

const ownedTables=['questions','reports','exams','video_cache','study_notes','profiles','study_plans'];
// Yeni kullanıcı oluşturur, Supabase Auth üzerinde kaydeder, Tenant (çalışma alanı) ve profilini açar.
// Sistemdeki İLK hesap, hesap sisteminden önce kaydedilmiş (sahibi olmayan) verileri devralır.
export async function createUser(input:{
 email:string;
 name:string;
 password?:string;
 googleSub?:string;
 grade?:Profile['grade'];
 tenantName?:string;
 existingId?:string;
 sbAccessToken?:string|null;
 sbRefreshToken?:string|null;
}){
 await ensureSchema();
 const supa=activeSupabaseConfig();
 let id=input.existingId||crypto.randomUUID();
 let sbAccessToken:string|null=input.sbAccessToken||null;
 let sbRefreshToken:string|null=input.sbRefreshToken||null;

 // Supabase aktifse ve şifreli kayıt yapılıyorsa önce Supabase Auth (/auth/v1) üzerinde kullanıcıyı oluştur
 if(supa&&input.password&&!input.existingId){
  const sbRes=await supabaseAuthSignUp(supa,{
   email:input.email,
   password:input.password,
   name:input.name,
   grade:input.grade||'12',
   tenantName:input.tenantName
  });
  if(sbRes.duplicate){
   const sbLogin=await supabaseAuthSignIn(supa,{email:input.email,password:input.password});
   if(sbLogin.user?.id){
    id=sbLogin.user.id;
    sbAccessToken=sbLogin.user.accessToken;
    sbRefreshToken=sbLogin.user.refreshToken;
   }else{
    throw new AppError('Bu e-posta adresiyle zaten bir hesap var. Giriş yapmayı dene.',409);
   }
  }else if(sbRes.user?.id){
   id=sbRes.user.id;
   sbAccessToken=sbRes.user.accessToken;
   sbRefreshToken=sbRes.user.refreshToken;
  }
 }

 const now=new Date().toISOString();
 let hash:string|null=null,salt:string|null=null;
 if(input.password){
  const h=await hashPassword(input.password);
  hash=h.hash;
  salt=h.salt;
 }
 const first=Number((await db().prepare('SELECT COUNT(*) AS n FROM users').first())?.n||0)===0;
 try{
  const existingByEmail=await db().prepare('SELECT id,password_hash FROM users WHERE email=?').bind(input.email).first();
  if(existingByEmail&&String(existingByEmail.id)!==id&&existingByEmail.password_hash){
   throw new AppError('Bu e-posta adresiyle zaten bir hesap var. Giriş yapmayı dene.',409);
  }
  if(existingByEmail){
   id=String(existingByEmail.id);
   await db().prepare('UPDATE users SET name=?,password_hash=?,password_salt=?,tenant_id=? WHERE id=?')
    .bind(input.name,hash,salt,id,id).run();
  }else{
   await db().prepare('INSERT INTO users (id,email,name,password_hash,password_salt,google_sub,tenant_id,created_at) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,password_hash=excluded.password_hash,password_salt=excluded.password_salt')
    .bind(id,input.email,input.name,hash,salt,input.googleSub||null,id,now).run();
  }
 }catch(e){
  if(e instanceof AppError)throw e;
  if(/UNIQUE/i.test(String((e as Error)?.message)))throw new AppError('Bu e-posta adresiyle zaten bir hesap var. Giriş yapmayı dene.',409);
  throw e;
 }

 // Kullanıcının Tenant (çalışma alanı) ve tenant_members kaydını oluştur
 const tInfo=await ensureUserTenant(db(),{
  userId:id,
  name:input.name,
  email:input.email,
  tenantName:input.tenantName
 });

 if(first)await db().batch(ownedTables.map(t=>db().prepare(`UPDATE OR IGNORE ${t} SET user_id=? WHERE user_id NOT IN (SELECT id FROM users)`).bind(tInfo.tenantId)));
 const p=profileFor(input.name,input.grade||'12');
 await db().prepare('INSERT INTO profiles (user_id,name,grade,target,exam_year,exam_date,motto,daily_goal,school,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(user_id) DO NOTHING')
  .bind(tInfo.tenantId,p.name,p.grade,p.target,p.examYear,p.examDate,p.motto,p.dailyGoal,p.school,input.googleSub&&!input.grade?'':now).run();
 return {id,tenantId:tInfo.tenantId,first,sbAccessToken,sbRefreshToken};
}
