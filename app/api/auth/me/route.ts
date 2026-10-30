import {z} from 'zod';
import {db,activeSupabaseConfig,failure,json,AppError,sameOrigin,sessionUser,ensureSchema,readSessionToken} from '@/lib/server';
import {supabaseAuthGetUser,ensureUserTenant} from '@/lib/supabase';
import {createUser,createSession,normalizeEmail,googleReady,registrationOpen} from '@/lib/auth';
// Oturum durumu: giriş ekranının hangi seçenekleri göstereceğini söyler; POST ile Supabase OAuth callback token'ını oturuma dönüştürür.
export async function GET(req:Request){try{
 const user=await sessionUser(req);
 const supa=activeSupabaseConfig();
 const tok=user?readSessionToken(req):'';
 return Response.json({
  user,
  sessionToken:tok||undefined,
  googleReady:googleReady(),
  registrationOpen:registrationOpen(),
  authProvider:supa?'supabase':'local'
 },{headers:{'Cache-Control':'private, no-store'}});
}catch(e){return failure(e)}}

export async function POST(req:Request){try{
 sameOrigin(req);await ensureSchema();
 const supa=activeSupabaseConfig();
 if(!supa)throw new AppError('Supabase bağlantısı aktif değil.',400);
 const p=z.object({accessToken:z.string().min(10),refreshToken:z.string().optional().default('')}).safeParse(await json(req));
 if(!p.success)throw new AppError('Geçersiz Supabase oturum belirteci.',400);
 const verified=await supabaseAuthGetUser(supa,p.data.accessToken,p.data.refreshToken||null);
 if(!verified.user||!verified.user.email)throw new AppError('Supabase oturumu doğrulanamadı.',401);
 const email=normalizeEmail(verified.user.email);
 let row=await db().prepare('SELECT id,name FROM users WHERE email=?').bind(email).first();
 let userId=row?String(row.id):'';
 let tenantId='';
 if(!userId){
  const u=await createUser({
   email,
   name:verified.user.name,
   existingId:verified.user.id,
   sbAccessToken:verified.user.accessToken,
   sbRefreshToken:verified.user.refreshToken,
   profileMeta:verified.user.metadata
  });
  userId=u.id;
  tenantId=u.tenantId;
 }else{
  const tInfo=await ensureUserTenant(db(),{userId,name:String(row!.name||verified.user.name),email});
  tenantId=tInfo.tenantId;
 }
 const tokenOut={token:''};
 const cookie=await createSession(req,userId,{
  tenantId,
  sbAccessToken:verified.user.accessToken,
  sbRefreshToken:verified.user.refreshToken,
  tokenOut
 });
 return Response.json({ok:true,tenantId,sessionToken:tokenOut.token,authProvider:'supabase'},{headers:{'Set-Cookie':cookie}});
}catch(e){return failure(e)}}
