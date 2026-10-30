import {z} from 'zod';
import {db,activeSupabaseConfig,isDeveloper,DEVELOPER_EMAIL,failure,json,AppError,sameOrigin,ensureSchema} from '@/lib/server';
import {supabaseAuthSignIn,supabaseAuthSignUp,ensureUserTenant} from '@/lib/supabase';
import {createUser,createSession,normalizeEmail,validEmail,verifyPassword,throttleCheck,throttleHit,throttleClear,clientIp,registrationOpen} from '@/lib/auth';
const wrong='E-posta ya da şifre hatalı.';
export async function POST(req:Request){try{
 sameOrigin(req);await ensureSchema();
 const p=z.object({
  email:z.string().trim().max(200),
  password:z.string().max(200).optional().default(''),
  remember:z.boolean().optional().default(true)
 }).safeParse(await json(req));
 if(!p.success||!p.data.email)throw new AppError('E-posta adresini yaz.');
 const email=normalizeEmail(p.data.email);
 const remember=p.data.remember!==false;
 const tokenOut={token:''};

 // 0. Şifresiz Geliştirici (Developer) hesabı girişi: netududev@gmail.com şifre istemeden doğrudan giriş yapar
 if(email===DEVELOPER_EMAIL){
  const devRow=await db().prepare('SELECT id,name,tenant_id FROM users WHERE email=?').bind(DEVELOPER_EMAIL).first();
  let userId='';
  let tenantId='';
  if(!devRow){
   const u=await createUser({
    email:DEVELOPER_EMAIL,
    name:'netudu Developer',
    tenantName:'netudu Developer Alanı'
   });
   userId=u.id;
   tenantId=u.tenantId;
  }else{
   userId=String(devRow.id);
   const tInfo=await ensureUserTenant(db(),{userId,name:String(devRow.name||'netudu Developer'),email:DEVELOPER_EMAIL,tenantName:'netudu Developer Alanı'});
   tenantId=tInfo.tenantId;
  }
  const cookie=await createSession(req,userId,{tenantId,remember,tokenOut});
  return Response.json({ok:true,developer:true,tenantId,sessionToken:remember?tokenOut.token:undefined,authProvider:activeSupabaseConfig()?'supabase':'local'},{headers:{'Set-Cookie':cookie}});
 }

 if(!p.data.password)throw new AppError('E-posta ve şifreni yaz.');
 const key='login:'+email;const ipKey='login-ip:'+clientIp(req);
 await throttleCheck(key,8);await throttleCheck(ipKey,30);

 const supa=activeSupabaseConfig();
 let sbAccessToken:string|null=null;
 let sbRefreshToken:string|null=null;

 // 1. Supabase Auth aktifse önce /auth/v1/token?grant_type=password ile Supabase üzerinde doğrula
 if(supa){
  const sbLogin=await supabaseAuthSignIn(supa,{email,password:p.data.password});
  if(sbLogin.user){
   sbAccessToken=sbLogin.user.accessToken;
   sbRefreshToken=sbLogin.user.refreshToken;
   const row=await db().prepare('SELECT id,name,tenant_id FROM users WHERE email=?').bind(email).first();
   if(!row){
    const u=await createUser({
     email,
     name:sbLogin.user.name,
     password:p.data.password,
     existingId:sbLogin.user.id,
     sbAccessToken,
     sbRefreshToken,
     profileMeta:sbLogin.user.metadata
    });
    await throttleClear(key);
    const cookie=await createSession(req,u.id,{tenantId:u.tenantId,sbAccessToken,sbRefreshToken,remember,tokenOut});
    return Response.json({ok:true,claimed:u.first,authProvider:'supabase',tenantId:u.tenantId,sessionToken:remember?tokenOut.token:undefined},{headers:{'Set-Cookie':cookie}});
   }
   const userId=String(row.id);
   const tInfo=await ensureUserTenant(db(),{userId,name:String(row.name||sbLogin.user.name),email});
   await throttleClear(key);
   const cookie=await createSession(req,userId,{tenantId:tInfo.tenantId,sbAccessToken,sbRefreshToken,remember,tokenOut});
   return Response.json({ok:true,authProvider:'supabase',tenantId:tInfo.tenantId,sessionToken:remember?tokenOut.token:undefined},{headers:{'Set-Cookie':cookie}});
  }
 }

 // 2. Yerel / veritabanı kullanıcı kontrolü (veya ilk girişte otomatik kayıt)
 const row=await db().prepare('SELECT id,name,password_hash,password_salt,google_sub,tenant_id FROM users WHERE email=?').bind(email).first();
 if(!row&&registrationOpen()&&validEmail(email)){
  const rawName=email.split('@')[0].replace(/[._-]+/g,' ').trim();
  const name=rawName.length>=2?rawName.replace(/\b\w/g,c=>c.toLocaleUpperCase('tr')):'Öğrenci';
  const u=await createUser({email,name,password:p.data.password});
  const cookie=await createSession(req,u.id,{tenantId:u.tenantId,sbAccessToken:u.sbAccessToken,sbRefreshToken:u.sbRefreshToken,remember,tokenOut});
  return Response.json({ok:true,claimed:u.first,authProvider:supa?'supabase':'local',tenantId:u.tenantId,sessionToken:remember?tokenOut.token:undefined},{headers:{'Set-Cookie':cookie}});
 }
 if(row&&!row.password_hash&&row.google_sub)throw new AppError('Bu hesap Google ile açılmış. "Google ile devam et" düğmesini kullan.',400);
 const ok=!!row&&!!row.password_hash&&await verifyPassword(p.data.password,String(row.password_hash),String(row.password_salt));
 if(!ok){await throttleHit(key);await throttleHit(ipKey);throw new AppError(wrong,401)}

 const userId=String(row!.id);
 if(supa&&!sbAccessToken){
  const existingProf=await db().prepare('SELECT grade FROM profiles WHERE user_id=?').bind(userId).first();
  const syncedAuth=await supabaseAuthSignUp(supa,{email,password:p.data.password,name:String(row!.name||'Öğrenci'),grade:existingProf?.grade?String(existingProf.grade):undefined});
  if(syncedAuth.user){
   sbAccessToken=syncedAuth.user.accessToken;
   sbRefreshToken=syncedAuth.user.refreshToken;
  }
 }
 const tInfo=await ensureUserTenant(db(),{userId,name:String(row!.name||'Öğrenci'),email});
 await throttleClear(key);
 const cookie=await createSession(req,userId,{tenantId:tInfo.tenantId,sbAccessToken,sbRefreshToken,remember,tokenOut});
 return Response.json({ok:true,authProvider:supa?'supabase':'local',tenantId:tInfo.tenantId,sessionToken:remember?tokenOut.token:undefined},{headers:{'Set-Cookie':cookie}});
}catch(e){return failure(e)}}
