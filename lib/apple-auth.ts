// Apple ile giriş (Sign in with Apple, OIDC). Yalnız WebCrypto kullanır; yeni paket gerekmez.
// client_secret: Apple'ın istediği ES256 imzalı kısa ömürlü JWT. id_token: Apple'ın JWKS anahtarlarıyla RS256 doğrulanır.
export const APPLE_ISSUER='https://appleid.apple.com';
export const APPLE_JWKS_URL='https://appleid.apple.com/auth/keys';
export type AppleEnv={APPLE_CLIENT_ID?:string;APPLE_TEAM_ID?:string;APPLE_KEY_ID?:string;APPLE_PRIVATE_KEY?:string};
export type Jwk={kty:string;kid:string;n?:string;e?:string;alg?:string;use?:string};

// Düğme yalnız dört değişkenin hepsi tanımlıysa görünür.
export const appleConfigured=(b:AppleEnv)=>!!(b.APPLE_CLIENT_ID&&b.APPLE_TEAM_ID&&b.APPLE_KEY_ID&&b.APPLE_PRIVATE_KEY);

const enc=new TextEncoder();
export function b64urlEncode(bytes:Uint8Array|string){const u=typeof bytes==='string'?enc.encode(bytes):bytes;let s='';for(const b of u)s+=String.fromCharCode(b);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
export function b64urlDecode(s:string){const p=s.replace(/-/g,'+').replace(/_/g,'/')+'==='.slice((s.length+3)%4);const bin=atob(p);const u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u}
const jsonPart=(s:string)=>JSON.parse(new TextDecoder().decode(b64urlDecode(s))) as Record<string,any>;

// .p8 içeriği (PEM; ortam değişkeninde satır sonları "\n" olarak yazılmış olabilir) -> PKCS8 DER
export function pemToDer(pem:string){const body=pem.replace(/\\n/g,'\n').replace(/-----BEGIN [A-Z ]+-----|-----END [A-Z ]+-----|\s+/g,'');if(!body)throw new Error('apple_key');return b64urlDecode(body.replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''))}

export async function makeClientSecret(env:Required<AppleEnv>,nowSec=Math.floor(Date.now()/1000),signKey?:CryptoKey){
 const key=signKey||await crypto.subtle.importKey('pkcs8',pemToDer(env.APPLE_PRIVATE_KEY),{name:'ECDSA',namedCurve:'P-256'},false,['sign']);
 const head=b64urlEncode(JSON.stringify({alg:'ES256',kid:env.APPLE_KEY_ID,typ:'JWT'}));
 const body=b64urlEncode(JSON.stringify({iss:env.APPLE_TEAM_ID,iat:nowSec,exp:nowSec+600,aud:APPLE_ISSUER,sub:env.APPLE_CLIENT_ID}));
 // WebCrypto ECDSA çıktısı zaten JWS'in beklediği ham r||s (IEEE P1363) biçimindedir.
 const sig=new Uint8Array(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},key,enc.encode(`${head}.${body}`)));
 return `${head}.${body}.${b64urlEncode(sig)}`}

export type AppleClaims={sub:string;email?:string;email_verified?:boolean|string;nonce?:string;iss:string;aud:string;exp:number};
// id_token doğrulaması: imza (kid ile eşleşen JWKS anahtarı, RS256), iss, aud, exp, nonce. Başarısızsa null.
export async function verifyIdToken(token:string,opts:{clientId:string;nonce:string;keys:Jwk[];nowSec?:number}):Promise<AppleClaims|null>{
 try{const parts=token.split('.');if(parts.length!==3)return null;const head=jsonPart(parts[0]);if(head.alg!=='RS256')return null;
  const jwk=opts.keys.find(k=>k.kid===head.kid&&k.kty==='RSA');if(!jwk)return null;
  const key=await crypto.subtle.importKey('jwk',{kty:'RSA',n:jwk.n,e:jwk.e,alg:'RS256',ext:true},{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
  const ok=await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,b64urlDecode(parts[2]),enc.encode(`${parts[0]}.${parts[1]}`));if(!ok)return null;
  const c=jsonPart(parts[1]) as AppleClaims;const now=opts.nowSec??Math.floor(Date.now()/1000);
  if(c.iss!==APPLE_ISSUER||c.aud!==opts.clientId||!c.sub||typeof c.exp!=='number'||c.exp<now-60)return null;
  if(!c.nonce||c.nonce!==opts.nonce)return null;
  return c}catch{return null}}
// Apple e-posta doğrulamasını bazen "true" dizgesi olarak yollar
export const emailVerified=(c:AppleClaims)=>c.email_verified===true||c.email_verified==='true';

// Hesap eşleme kararı (saf): e-postası eşleşen kullanıcıda şifre varsa otomatik bağlama yapılmaz (hesap ele geçirme riski);
// şifresiz (sosyal girişle açılmış) hesapta eşleme serbest; hesap yoksa kayıt açıksa oluşturulur.
export type AppleDecision={action:'link';id:string}|{action:'password_exists'}|{action:'create'}|{action:'closed'};
export function decideAppleAccount(row:{id:unknown;password_hash?:unknown}|null|undefined,registrationOpen:boolean):AppleDecision{
 if(row)return row.password_hash?{action:'password_exists'}:{action:'link',id:String(row.id)};
 return registrationOpen?{action:'create'}:{action:'closed'}}

// Apple "user" form alanındaki adı kontrol karakterlerinden arındırır (boşluklar sadeleşir, en çok 60 karakter).
export function cleanAppleName(raw:string){return raw.replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2066-\u2069\ufeff]/g,' ').replace(/\s+/g,' ').trim().slice(0,60)}
