import assert from 'node:assert/strict';
import {webcrypto as crypto} from 'node:crypto';
const A=await import((process.env.ND_ROOT||process.cwd())+'/lib/apple-auth.ts');
let n=0;const t=async(name,f)=>{try{await f();n++;console.log('ok  ',name)}catch(e){console.log('FAIL',name,e.message);process.exitCode=1}};
const full={APPLE_CLIENT_ID:'com.netudu.web',APPLE_TEAM_ID:'TEAM123456',APPLE_KEY_ID:'KEY1234567',APPLE_PRIVATE_KEY:'x'};
await t('appleConfigured: dört değişken şart',()=>{assert.equal(A.appleConfigured(full),true);for(const k of Object.keys(full))assert.equal(A.appleConfigured({...full,[k]:''}),false);assert.equal(A.appleConfigured({}),false)});
// ES256 client_secret: .p8 (PKCS8 PEM) üret, imzala, genel anahtarla doğrula
const ec=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);
const der=new Uint8Array(await crypto.subtle.exportKey('pkcs8',ec.privateKey));
const pem='-----BEGIN PRIVATE KEY-----\n'+Buffer.from(der).toString('base64').match(/.{1,64}/g).join('\n')+'\n-----END PRIVATE KEY-----\n';
await t('client_secret: ES256 imzası doğrulanır, claim\'ler doğru',async()=>{const jwt=await A.makeClientSecret({...full,APPLE_PRIVATE_KEY:pem},1700000000);const [h,p,s]=jwt.split('.');const head=JSON.parse(Buffer.from(h,'base64url'));const pl=JSON.parse(Buffer.from(p,'base64url'));assert.deepEqual(head,{alg:'ES256',kid:'KEY1234567',typ:'JWT'});assert.equal(pl.iss,'TEAM123456');assert.equal(pl.sub,'com.netudu.web');assert.equal(pl.aud,'https://appleid.apple.com');assert.equal(pl.exp-pl.iat,600);const sig=Buffer.from(s,'base64url');assert.equal(sig.length,64);assert.ok(await crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},ec.publicKey,sig,new TextEncoder().encode(h+'.'+p)))});
await t('client_secret: "\\n" kaçışlı tek satır PEM da kabul edilir',async()=>{const jwt=await A.makeClientSecret({...full,APPLE_PRIVATE_KEY:pem.replace(/\n/g,'\\n')},1700000000);assert.equal(jwt.split('.').length,3)});
await t('client_secret: bozuk anahtar hata verir',async()=>{await assert.rejects(()=>A.makeClientSecret({...full,APPLE_PRIVATE_KEY:'bozuk'}))});
// id_token: RS256 anahtar çifti üret, JWKS gibi sun
const rsa=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
const jwk=await crypto.subtle.exportKey('jwk',rsa.publicKey);const keys=[{kty:'RSA',kid:'K1',n:jwk.n,e:jwk.e,alg:'RS256',use:'sig'}];
const mkTok=async(claims,head={alg:'RS256',kid:'K1'},key=rsa.privateKey)=>{const h=Buffer.from(JSON.stringify(head)).toString('base64url'),p=Buffer.from(JSON.stringify(claims)).toString('base64url');const s=Buffer.from(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',key,new TextEncoder().encode(h+'.'+p))).toString('base64url');return `${h}.${p}.${s}`};
const base={iss:'https://appleid.apple.com',aud:'com.netudu.web',sub:'001.abc',exp:2000000000,nonce:'N1',email:'a@b.com',email_verified:'true'};
const opt={clientId:'com.netudu.web',nonce:'N1',keys,nowSec:1900000000};
await t('id_token: geçerli',async()=>{const c=await A.verifyIdToken(await mkTok(base),opt);assert.equal(c.sub,'001.abc');assert.equal(A.emailVerified(c),true)});
await t('id_token: yanlış nonce reddedilir',async()=>assert.equal(await A.verifyIdToken(await mkTok(base),{...opt,nonce:'X'}),null));
await t('id_token: nonce yoksa reddedilir',async()=>assert.equal(await A.verifyIdToken(await mkTok({...base,nonce:undefined}),opt),null));
await t('id_token: yanlış aud/iss reddedilir',async()=>{assert.equal(await A.verifyIdToken(await mkTok({...base,aud:'baska'}),opt),null);assert.equal(await A.verifyIdToken(await mkTok({...base,iss:'https://evil.com'}),opt),null)});
await t('id_token: süresi geçmiş reddedilir',async()=>assert.equal(await A.verifyIdToken(await mkTok({...base,exp:1800000000}),opt),null));
await t('id_token: başka anahtarla imza reddedilir',async()=>{const other=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);assert.equal(await A.verifyIdToken(await mkTok(base,{alg:'RS256',kid:'K1'},other.privateKey),opt),null)});
await t('id_token: bilinmeyen kid, alg=none, bozuk biçim reddedilir',async()=>{assert.equal(await A.verifyIdToken(await mkTok(base,{alg:'RS256',kid:'YOK'}),opt),null);assert.equal(await A.verifyIdToken(await mkTok(base,{alg:'none',kid:'K1'}),opt),null);assert.equal(await A.verifyIdToken('a.b',opt),null);assert.equal(await A.verifyIdToken('',opt),null)});
await t('id_token: imza kurcalanırsa reddedilir',async()=>{const tk=await mkTok(base);const [h,p,s]=tk.split('.');const p2=Buffer.from(JSON.stringify({...base,sub:'saldirgan'})).toString('base64url');assert.equal(await A.verifyIdToken(`${h}.${p2}.${s}`,opt),null)});
await t('emailVerified: boolean ve dizge',()=>{assert.equal(A.emailVerified({email_verified:true}),true);assert.equal(A.emailVerified({email_verified:'false'}),false);assert.equal(A.emailVerified({}),false)});
await t('decideAppleAccount: şifreli hesap bağlanmaz, şifresiz bağlanır, yoksa oluşturulur/kapalı',()=>{
 assert.deepEqual(A.decideAppleAccount({id:'u1',password_hash:'h'},true),{action:'password_exists'});
 assert.deepEqual(A.decideAppleAccount({id:'u1',password_hash:'h'},false),{action:'password_exists'});
 assert.deepEqual(A.decideAppleAccount({id:'u2',password_hash:null},false),{action:'link',id:'u2'});
 assert.deepEqual(A.decideAppleAccount({id:'u3'},true),{action:'link',id:'u3'});
 assert.deepEqual(A.decideAppleAccount(null,true),{action:'create'});
 assert.deepEqual(A.decideAppleAccount(undefined,false),{action:'closed'})});
await t('cleanAppleName: kontrol karakterleri, bidi, uzunluk',()=>{
 assert.equal(A.cleanAppleName('Ali\u0000 \n\u202eVeli\t'),'Ali Veli');
 assert.equal(A.cleanAppleName('\u0007\u200b'),'');
 assert.equal(A.cleanAppleName('a'.repeat(100)).length,60)});
console.log(`apple: ${n} test geçti`);
