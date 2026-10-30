import {db,activeSupabaseConfig,failure,sameOrigin,readSessionToken,sha256} from '@/lib/server';
import {supabaseAuthLogout} from '@/lib/supabase';
import {clearSessionCookie} from '@/lib/auth';
export async function POST(req:Request){try{
 sameOrigin(req);
 const token=readSessionToken(req);
 if(token){
  const sid=await sha256(token);
  const supa=activeSupabaseConfig();
  if(supa){
   const sRow=await db().prepare('SELECT sb_access_token FROM sessions WHERE id=?').bind(sid).first().catch(()=>null);
   if(sRow?.sb_access_token)await supabaseAuthLogout(supa,String(sRow.sb_access_token));
  }
  await db().prepare('DELETE FROM sessions WHERE id=?').bind(sid).run();
 }
 return Response.json({ok:true},{headers:{'Set-Cookie':clearSessionCookie(req)}});
}catch(e){return failure(e)}}
