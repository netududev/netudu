import {z} from 'zod';
import {db,bindings,activeSupabaseConfig,sha256,failure,json,AppError,sameOrigin,ensureSchema} from '@/lib/server';
import { isJwtKey, supabaseAuthUpdatePassword, ensureUserTenant } from '@/lib/supabase';
import {normalizeEmail,validEmail,checkPassword,hashPassword,createSession,throttleCheck,throttleHit,throttleClear,clientIp} from '@/lib/auth';

async function sendResetEmailViaResend(apiKey:string,toEmail:string,userName:string,code:string):Promise<boolean>{
 try{
  const r=await fetch('https://api.resend.com/emails',{
   method:'POST',
   headers:{
    Authorization:`Bearer ${apiKey}`,
    'Content-Type':'application/json'
   },
   body:JSON.stringify({
    from:'netudu <onboarding@resend.dev>',
    to:[toEmail],
    subject:`netudu · Şifre Sıfırlama Kodun: ${code}`,
    html:`<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:0 auto;padding:28px;background:#1b1f23;color:#e7eaed;border-radius:16px;border:1px solid #333a41">
     <h2 style="margin:0 0 12px;color:#5fd0b6">netudu · Şifre Sıfırlama</h2>
     <p style="margin:0 0 16px;color:#c3ccd3;line-height:1.6">Merhaba <b>${userName||'Öğrenci'}</b>, hesabının şifresini sıfırlamak için doğrulama kodun aşağıdadır:</p>
     <div style="background:#24292e;border:2px solid #2fb597;border-radius:12px;padding:18px;text-align:center;font-size:28px;font-weight:700;letter-spacing:8px;color:#5fd0b6;margin:18px 0">${code}</div>
     <p style="margin:0;color:#9aa5ae;font-size:13px;line-height:1.5">Bu kod 15 dakika boyunca geçerlidir. Eğer bu işlemi sen başlatmadıysan bu e-postayı dikkate almayabilirsin.</p>
    </div>`
   }),
   signal:AbortSignal.timeout(10000)
  });
  return r.ok;
 }catch{
  return false;
 }
}

async function triggerSupabaseRecoveryOtp(email:string):Promise<boolean>{
 const supa=activeSupabaseConfig();
 if(!supa)return false;
 const h:Record<string,string>={
  apikey:supa.key,
  'Content-Type':'application/json'
 };
 if(isJwtKey(supa.key))h.Authorization=`Bearer ${supa.key}`;
 try{
  const otpRes=await fetch(`${supa.url}/auth/v1/otp`,{
   method:'POST',
   headers:h,
   body:JSON.stringify({email,create_user:false}),
   signal:AbortSignal.timeout(8000)
  });
  if(otpRes.ok)return true;
  const recRes=await fetch(`${supa.url}/auth/v1/recover`,{
   method:'POST',
   headers:h,
   body:JSON.stringify({email}),
   signal:AbortSignal.timeout(8000)
  });
  return recRes.ok;
 }catch{
  return false;
 }
}

async function verifySupabaseOtp(email:string,token:string):Promise<string|null>{
 const supa=activeSupabaseConfig();
 if(!supa)return null;
 const h:Record<string,string>={
  apikey:supa.key,
  'Content-Type':'application/json'
 };
 if(isJwtKey(supa.key))h.Authorization=`Bearer ${supa.key}`;
 for(const type of ['email','recovery','magiclink'] as const){
  try{
   const r=await fetch(`${supa.url}/auth/v1/verify`,{
    method:'POST',
    headers:h,
    body:JSON.stringify({type,email,token}),
    signal:AbortSignal.timeout(8000)
   });
   if(r.ok){
    const d=await r.json().catch(()=>({})) as {access_token?:string};
    return d.access_token||'verified';
   }
  }catch{}
 }
 return null;
}

export async function POST(req:Request){
 try{
  sameOrigin(req);
  await ensureSchema();
  const body=await json(req) as Record<string,unknown>;
  const action=String(body?.action||'request');
  const ipKey='pwreset-ip:'+clientIp(req);
  await throttleCheck(ipKey,25);

  if(action==='request'){
   const p=z.object({email:z.string().trim().max(200)}).safeParse(body);
   if(!p.success||!p.data.email)throw new AppError('E-posta adresini yaz.');
   const email=normalizeEmail(p.data.email);
   if(!validEmail(email))throw new AppError('Geçerli bir e-posta adresi yaz.');

   const reqKey='pwreset-req:'+email;
   await throttleCheck(reqKey,8);
   await throttleHit(reqKey,15);
   await throttleHit(ipKey,15);

   const uRow=await db().prepare('SELECT id,name,email FROM users WHERE email=?').bind(email).first();
   if(!uRow){
    throw new AppError('Bu e-posta adresiyle kayıtlı bir hesap bulunamadı. "Kayıt ol" sekmesinden yeni hesap açabilirsin.',404);
   }

   const rand=crypto.getRandomValues(new Uint32Array(1))[0];
   const code=String(100000+(rand%900000));
   const codeHash=await sha256(code);
   const now=new Date();
   const expiresAt=new Date(now.getTime()+15*60000).toISOString();

   await db().prepare(
    'INSERT INTO password_resets (email,code_hash,expires_at,attempts,created_at) VALUES (?,?,?,0,?) ON CONFLICT(email) DO UPDATE SET code_hash=excluded.code_hash,expires_at=excluded.expires_at,attempts=0,created_at=excluded.created_at'
   ).bind(email,codeHash,expiresAt,now.toISOString()).run();

   const resendKey=bindings().RESEND_API_KEY||'';
   let sentByResend=false;
   if(resendKey){
    sentByResend=await sendResetEmailViaResend(resendKey,email,String(uRow.name||'Öğrenci'),code);
   }
   const sentBySupabase=!sentByResend?await triggerSupabaseRecoveryOtp(email):false;

   return Response.json({
    ok:true,
    email,
    emailSent:sentByResend||sentBySupabase,
    deliveryMethod:sentByResend?'resend':sentBySupabase?'supabase':'local',
    previewCode:sentByResend?undefined:code,
    message:sentByResend
     ?`${email} adresine 6 haneli şifre sıfırlama kodu gönderildi. Gelen kutunu (ve gereksiz kutusunu) kontrol et.`
     :sentBySupabase
     ?`${email} adresine Supabase üzerinden doğrulama e-postası gönderildi (ayrıca hızlı doğrulama kodun oluşturuldu).`
     :`${email} hesabı için 6 haneli şifre sıfırlama kodu oluşturuldu.`
   });
  }

  if(action==='verify'){
   const p=z.object({
    email:z.string().trim().max(200),
    code:z.string().trim().min(4).max(12),
    password:z.string().max(200)
   }).safeParse(body);
   if(!p.success)throw new AppError('E-posta, doğrulama kodu ve yeni şifre alanlarını kontrol et.');
   const email=normalizeEmail(p.data.email);
   const cleanCode=p.data.code.replace(/\s+/g,'');
   checkPassword(p.data.password);

   const uRow=await db().prepare('SELECT id,name,tenant_id FROM users WHERE email=?').bind(email).first();
   if(!uRow)throw new AppError('Bu e-posta adresiyle kayıtlı hesap bulunamadı.',404);

   const rRow=await db().prepare('SELECT code_hash,expires_at,attempts FROM password_resets WHERE email=?').bind(email).first();
   const nowIso=new Date().toISOString();
   let verified=false;
   let sbToken:string|null=null;

   if(rRow&&String(rRow.expires_at)>nowIso&&Number(rRow.attempts||0)<6){
    const inputHash=await sha256(cleanCode);
    if(inputHash===String(rRow.code_hash)){
     verified=true;
    }
   }
   if(!verified){
    sbToken=await verifySupabaseOtp(email,cleanCode);
    if(sbToken)verified=true;
   }

   if(!verified){
    if(rRow){
     await db().prepare('UPDATE password_resets SET attempts=attempts+1 WHERE email=?').bind(email).run().catch(()=>{});
    }
    await throttleHit(ipKey,15);
    throw new AppError('Doğrulama kodu hatalı veya süresi dolmuş. Lütfen kodu kontrol et ya da yeni kod iste.',400);
   }

   const userId=String(uRow.id);
   const {hash,salt}=await hashPassword(p.data.password);
   await db().batch([
    db().prepare('UPDATE users SET password_hash=?,password_salt=? WHERE id=?').bind(hash,salt,userId),
    db().prepare('DELETE FROM password_resets WHERE email=?').bind(email),
    db().prepare('DELETE FROM sessions WHERE user_id=?').bind(userId)
   ]);

   const supa=activeSupabaseConfig();
   if(supa){
    await supabaseAuthUpdatePassword(supa,userId,sbToken&&sbToken!=='verified'?sbToken:null,p.data.password);
   }

   const tInfo=await ensureUserTenant(db(),{userId,name:String(uRow.name||'Öğrenci'),email});
   await throttleClear('login:'+email);
   await throttleClear('pwreset-req:'+email);
   const tokenOut={token:''};
   const cookie=await createSession(req,userId,{
    tenantId:tInfo.tenantId,
    sbAccessToken:sbToken&&sbToken!=='verified'?sbToken:null,
    tokenOut
   });
   return Response.json({
    ok:true,
    sessionToken:tokenOut.token,
    message:'Şifren başarıyla sıfırlandı ve hesabına giriş yapıldı!'
   },{headers:{'Set-Cookie':cookie}});
  }

  throw new AppError('Geçersiz işlem.',400);
 }catch(e){
  return failure(e);
 }
}

