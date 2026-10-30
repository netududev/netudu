import {z} from 'zod';
import {db,activeSupabaseConfig,failure,json,AppError,requireUser,readSessionToken,sha256} from '@/lib/server';
import {supabaseAuthUpdatePassword,supabaseAuthSignIn} from '@/lib/supabase';
import {hashPassword,verifyPassword,checkPassword,throttleCheck,throttleHit} from '@/lib/auth';
// Şifre değiştir (veya Google hesabına şifre ekle). Supabase Auth aktifse /auth/v1/user üzerinden de günceller.
export async function POST(req:Request){try{
 const u=await requireUser(req);
 const p=z.object({current:z.string().max(200).optional().default(''),next:z.string().max(200)}).safeParse(await json(req));
 if(!p.success)throw new AppError('Şifre alanlarını kontrol et.');
 const supa=activeSupabaseConfig();
 const row=await db().prepare('SELECT password_hash,password_salt FROM users WHERE id=?').bind(u.id).first();
 if(row?.password_hash){
  const key='pw:'+u.id;await throttleCheck(key,6);
  let valid=await verifyPassword(p.data.current,String(row.password_hash),String(row.password_salt));
  if(!valid&&supa){
   const sbCheck=await supabaseAuthSignIn(supa,{email:u.email,password:p.data.current});
   valid=!!sbCheck.user;
  }
  if(!valid){await throttleHit(key);throw new AppError('Mevcut şifren hatalı.',400)}
 }
 checkPassword(p.data.next);
 if(supa){
  await supabaseAuthUpdatePassword(supa,u.id,u.sbAccessToken,p.data.next);
 }
 const h=await hashPassword(p.data.next);
 const keep=await sha256(readSessionToken(req));
 await db().batch([
  db().prepare('UPDATE users SET password_hash=?,password_salt=? WHERE id=?').bind(h.hash,h.salt,u.id),
  db().prepare('DELETE FROM sessions WHERE user_id=? AND id<>?').bind(u.id,keep)
 ]);
 return Response.json({ok:true});
}catch(e){return failure(e)}}
