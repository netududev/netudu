import {db,bindings,readCookie,ensureSchema} from '@/lib/server';
import {createSession,createUser,normalizeEmail,appleReady,registrationOpen,appOrigin} from '@/lib/auth';
import {makeClientSecret,verifyIdToken,emailVerified,APPLE_JWKS_URL,type Jwk,type AppleEnv} from '@/lib/apple-auth';
// Apple dönüşü (form_post): kodu belirteçle değiştirir, id_token'ı Apple anahtarlarıyla doğrular,
// doğrulanmış e-postayla hesabı bulur/oluşturur ve oturum açar (Google dönüşüyle aynı eşleme mantığı).
const CLEAR='nd_apple=; Path=/api/auth/apple; HttpOnly; SameSite=None; Max-Age=0; Secure';
export async function POST(req:Request){const origin=appOrigin(req);
 const fail=(code:string)=>new Response(null,{status:303,headers:{Location:`${origin}/?auth_error=${code}`,'Set-Cookie':CLEAR}});
 try{if(!appleReady())return fail('apple_off');
  const form=await req.formData();const state=String(form.get('state')||''),code=String(form.get('code')||'');
  const [savedState,nonce]=readCookie(req,'nd_apple').split('.');
  if(form.get('error'))return fail('apple_cancel');
  if(!code||!state||!nonce||state!==savedState)return fail('apple_state');
  const env=bindings() as unknown as Required<AppleEnv>;
  const secret=await makeClientSecret(env);
  const tr=await fetch('https://appleid.apple.com/auth/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'authorization_code',code,client_id:env.APPLE_CLIENT_ID,client_secret:secret,redirect_uri:origin+'/api/auth/apple/callback'}),signal:AbortSignal.timeout(15000)});
  if(!tr.ok)return fail('apple_token');const tok=await tr.json() as {id_token?:string};if(!tok.id_token)return fail('apple_token');
  const kr=await fetch(APPLE_JWKS_URL,{signal:AbortSignal.timeout(15000)});if(!kr.ok)return fail('apple_token');const keys=((await kr.json()) as {keys?:Jwk[]}).keys||[];
  const claims=await verifyIdToken(tok.id_token,{clientId:env.APPLE_CLIENT_ID,nonce,keys});
  if(!claims)return fail('apple_token');
  if(!claims.email||!emailVerified(claims))return fail('apple_email');
  await ensureSchema();const email=normalizeEmail(claims.email);
  const row=await db().prepare('SELECT id FROM users WHERE email=?').bind(email).first();
  let id=row?String(row.id):'';
  if(!id){if(!registrationOpen())return fail('closed');
   // Apple adı yalnız ilk girişte, "user" form alanında JSON olarak gelir
   let name='';try{const u=JSON.parse(String(form.get('user')||'{}')) as {name?:{firstName?:string;lastName?:string}};name=[u.name?.firstName,u.name?.lastName].filter(Boolean).join(' ')}catch{}
   id=(await createUser({email,name:(name||email.split('@')[0]).slice(0,60)})).id}
  const cookie=await createSession(req,id);const h=new Headers({Location:origin+'/'});h.append('Set-Cookie',cookie);h.append('Set-Cookie',CLEAR);return new Response(null,{status:303,headers:h})}
 catch{return fail('apple_error')}}
