import {bindings} from '@/lib/server';
import {appleReady,randomToken,appOrigin} from '@/lib/auth';
// Apple ile giriş: durum ve nonce üretir, Apple yetkilendirme sayfasına yönlendirir.
// Apple dönüşü çapraz site POST olduğundan durum çerezi SameSite=None; Secure olmalıdır (Apple zaten yalnız https adreslerine döner).
export async function GET(req:Request){
 const origin=appOrigin(req);
 if(!appleReady()||!origin.startsWith('https:'))return Response.redirect(origin+'/?auth_error=apple_off',302);
 const state=randomToken(24),nonce=randomToken(24);
 const u=new URL('https://appleid.apple.com/auth/authorize');
 u.search=new URLSearchParams({client_id:bindings().APPLE_CLIENT_ID!,redirect_uri:origin+'/api/auth/apple/callback',response_type:'code',response_mode:'form_post',scope:'name email',state,nonce}).toString();
 return new Response(null,{status:302,headers:{Location:u.toString(),'Set-Cookie':`nd_apple=${state}.${nonce}; Path=/api/auth/apple; HttpOnly; SameSite=None; Max-Age=600; Secure`}});
}
