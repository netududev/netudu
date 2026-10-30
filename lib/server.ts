import {platformEnv} from './platform-env';
import {getSupabaseConfig,setRuntimeSupabaseConfig,createSupabaseD1,createSupabaseBucket,supabaseAuthGetUser,ensureUserTenant} from './supabase';
import {createMemoryD1,createMemoryBucket} from './memory-db';
export class AppError extends Error{constructor(message:string,public status=400){super(message)}}
export type Bindings={DB:D1Database;BUCKET:R2Bucket;OPENAI_API_KEY?:string;OPENAI_MODEL?:string;YOUTUBE_API_KEY?:string;RESEND_API_KEY?:string;GOOGLE_CLIENT_ID?:string;GOOGLE_CLIENT_SECRET?:string;APP_URL?:string;ADMIN_EMAILS?:string;AI_LIMIT_SOLVE?:string;AI_LIMIT_NOTE?:string;AI_LIMIT_REPORT?:string;AI_LIMIT_VIDEO?:string;AI_LIMIT_QUOTE?:string;REGISTRATION_OPEN?:string;SUPABASE_URL?:string;SUPABASE_SERVICE_ROLE_KEY?:string;SUPABASE_ANON_KEY?:string;SUPABASE_KEY?:string};

const memoryDb=createMemoryD1();
const memoryBucket=createMemoryBucket();
let rawDbBroken=false;

export const DEVELOPER_EMAIL='netududev@gmail.com';
export const DEVELOPER_EMAILS=['netududev@gmail.com','yusufykykaya@gmail.com','batur2864@hotmail.com'] as const;
export function isDeveloper(email:string){return DEVELOPER_EMAILS.includes((email||'').trim().toLowerCase() as any)}

let runtimeAiConfig:{openaiKey?:string;openaiModel?:string;youtubeKey?:string;resendKey?:string}={};
export function setRuntimeAiConfig(cfg:{openaiKey?:string;openaiModel?:string;youtubeKey?:string;resendKey?:string}|null){
 runtimeAiConfig=cfg?{
  openaiKey:cfg.openaiKey?.trim()||undefined,
  openaiModel:cfg.openaiModel?.trim()||undefined,
  youtubeKey:cfg.youtubeKey?.trim()||undefined,
  resendKey:cfg.resendKey?.trim()||undefined
 }:{};
}
export function getRuntimeAiConfig(){return runtimeAiConfig}

export const rawBindings=()=>platformEnv() as unknown as Bindings;
export const localDb=():D1Database=>{const r=rawBindings();return (!rawDbBroken&&r?.DB)?r.DB:memoryDb};
export const activeSupabaseConfig=()=>getSupabaseConfig(rawBindings() as unknown as Record<string,unknown>);
export function bindings():Bindings{
 const raw=rawBindings();
 const supa=activeSupabaseConfig();
 const fallbackDb=(!rawDbBroken&&raw?.DB)?raw.DB:memoryDb;
 const fallbackBucket=raw?.BUCKET||memoryBucket;
 const merged:Bindings={
  ...raw,
  DB:fallbackDb,
  BUCKET:fallbackBucket,
  OPENAI_API_KEY:runtimeAiConfig.openaiKey||raw.OPENAI_API_KEY,
  OPENAI_MODEL:runtimeAiConfig.openaiModel||raw.OPENAI_MODEL||'gpt-4o-mini',
  YOUTUBE_API_KEY:runtimeAiConfig.youtubeKey||raw.YOUTUBE_API_KEY,
  RESEND_API_KEY:runtimeAiConfig.resendKey||raw.RESEND_API_KEY
 };
 if(!supa)return merged;
 return {...merged,DB:createSupabaseD1(supa,fallbackDb),BUCKET:createSupabaseBucket(supa,fallbackBucket)};
}
export function db():D1Database{return bindings().DB||memoryDb}
export const supabaseReady=()=>!!activeSupabaseConfig();
// Şema güvencesi: yeni sütun ve tablolar yoksa çalışma anında ekler (drizzle göçü uygulanmamış yerel
// önizlemeler için). Üretimde drizzle/0001 göçü önce koştuğu için burada hiçbir şey yapılmaz.
let schemaReady:Promise<void>|null=null;
export function ensureSchema(){if(!schemaReady)schemaReady=(async()=>{
 const rawDb=rawBindings()?.DB;
 if(rawDb&&!rawDbBroken){
  try{
   await rawDb.batch([
    rawDb.prepare("CREATE TABLE IF NOT EXISTS questions (id text PRIMARY KEY NOT NULL,user_id text NOT NULL,exam text NOT NULL,exam_type text NOT NULL,date text NOT NULL,subject text NOT NULL,topic text NOT NULL,question text NOT NULL,my_answer text DEFAULT '' NOT NULL,answer_key text DEFAULT '' NOT NULL,image_key text,mime text,analysis text,reviewed integer DEFAULT 0 NOT NULL,created_at text NOT NULL,analyzing_at text,mistake_type text DEFAULT 'yanlış' NOT NULL,review_stage integer DEFAULT 0 NOT NULL,next_review text,review_log text DEFAULT '[]' NOT NULL)"),
    rawDb.prepare('CREATE INDEX IF NOT EXISTS questions_user_date ON questions (user_id,date)'),
    rawDb.prepare("CREATE TABLE IF NOT EXISTS reports (id text PRIMARY KEY NOT NULL,user_id text NOT NULL,month text NOT NULL,notes text NOT NULL,updated_at text NOT NULL,goals text DEFAULT '[]' NOT NULL)"),
    rawDb.prepare('CREATE UNIQUE INDEX IF NOT EXISTS reports_user_month ON reports (user_id,month)'),
    rawDb.prepare('CREATE TABLE IF NOT EXISTS sys_config (key text PRIMARY KEY NOT NULL,value text NOT NULL)')
   ]);
   const cols=new Set(((await rawDb.prepare('PRAGMA table_info(questions)').all()).results as {name:string}[]).map(c=>c.name));const add=async(table:string,col:string,ddl:string)=>{await rawDb.prepare(`ALTER TABLE ${table} ADD ${col} ${ddl}`).run()};
   if(!cols.has('mistake_type'))await add('questions','mistake_type',"text DEFAULT 'yanlış' NOT NULL");if(!cols.has('review_stage'))await add('questions','review_stage','integer DEFAULT 0 NOT NULL');if(!cols.has('next_review'))await add('questions','next_review','text');if(!cols.has('review_log'))await add('questions','review_log',"text DEFAULT '[]' NOT NULL");
   const rcols=new Set(((await rawDb.prepare('PRAGMA table_info(reports)').all()).results as {name:string}[]).map(c=>c.name));if(!rcols.has('goals'))await add('reports','goals',"text DEFAULT '[]' NOT NULL");
   await rawDb.batch([rawDb.prepare('CREATE INDEX IF NOT EXISTS questions_user_next_review ON questions (user_id,next_review)'),rawDb.prepare('CREATE TABLE IF NOT EXISTS exams (id text PRIMARY KEY NOT NULL,user_id text NOT NULL,name text NOT NULL,exam_type text NOT NULL,date text NOT NULL,net real NOT NULL,correct integer,wrong integer,blank integer,notes text DEFAULT \'\' NOT NULL,created_at text NOT NULL)'),rawDb.prepare('CREATE INDEX IF NOT EXISTS exams_user_date ON exams (user_id,date)'),rawDb.prepare('CREATE TABLE IF NOT EXISTS video_cache (id text PRIMARY KEY NOT NULL,user_id text NOT NULL,subject text NOT NULL,topic text NOT NULL,videos text DEFAULT \'[]\' NOT NULL,rejected text DEFAULT \'[]\' NOT NULL,updated_at text NOT NULL)'),rawDb.prepare('CREATE UNIQUE INDEX IF NOT EXISTS video_cache_user_topic ON video_cache (user_id,subject,topic)'),rawDb.prepare('CREATE TABLE IF NOT EXISTS study_notes (id text PRIMARY KEY NOT NULL,user_id text NOT NULL,subject text NOT NULL,topic text NOT NULL,exam_type text DEFAULT \'\' NOT NULL,content text NOT NULL,prompt text DEFAULT \'\' NOT NULL,updated_at text NOT NULL)'),dStmt(rawDb,'CREATE UNIQUE INDEX IF NOT EXISTS study_notes_user_topic ON study_notes (user_id,subject,topic)'),rawDb.prepare('CREATE TABLE IF NOT EXISTS profiles (user_id text PRIMARY KEY NOT NULL,name text NOT NULL,grade text DEFAULT \'10\' NOT NULL,target text DEFAULT \'\' NOT NULL,exam_year integer DEFAULT 2028 NOT NULL,exam_date text DEFAULT \'2028-06-17\' NOT NULL,motto text DEFAULT \'\' NOT NULL,daily_goal integer DEFAULT 0 NOT NULL,school text DEFAULT \'\' NOT NULL,updated_at text DEFAULT \'\' NOT NULL)'),...accountDDL.map(q=>rawDb.prepare(q))]);
   const ucols=new Set(((await rawDb.prepare('PRAGMA table_info(users)').all()).results as {name:string}[]).map(c=>c.name));
   if(!ucols.has('tenant_id'))await add('users','tenant_id','text');
   const scols=new Set(((await rawDb.prepare('PRAGMA table_info(sessions)').all()).results as {name:string}[]).map(c=>c.name));
   if(!scols.has('tenant_id'))await add('sessions','tenant_id','text');
   if(!scols.has('sb_access_token'))await add('sessions','sb_access_token','text');
   if(!scols.has('sb_refresh_token'))await add('sessions','sb_refresh_token','text');
  }catch{
   rawDbBroken=true;
  }
 }
 // Geliştirici hesapları tarafından kaydedilmiş API bağlantı bilgisi varsa yükle (yerel D1 veya Supabase sys_config)
 try{
  const d=localDb();
  let cfgRows=((await d.prepare('SELECT key,value FROM sys_config').all()).results||[]) as {key:string;value:string}[];
  if(!cfgRows.length){
   cfgRows=((await db().prepare('SELECT key,value FROM sys_config').all()).results||[]) as {key:string;value:string}[];
  }
  const url=cfgRows.find(r=>r.key==='supabase_url')?.value||'';
  const key=cfgRows.find(r=>r.key==='supabase_key')?.value||'';
  if(url&&key)setRuntimeSupabaseConfig({url,key});
  const openaiKey=cfgRows.find(r=>r.key==='openai_api_key')?.value||'';
  const openaiModel=cfgRows.find(r=>r.key==='openai_model')?.value||'';
  const youtubeKey=cfgRows.find(r=>r.key==='youtube_api_key')?.value||'';
  const resendKey=cfgRows.find(r=>r.key==='resend_api_key')?.value||'';
  if(openaiKey||openaiModel||youtubeKey||resendKey)setRuntimeAiConfig({openaiKey,openaiModel,youtubeKey,resendKey});
 }catch{}})();return schemaReady}
const dStmt=(d:D1Database,q:string)=>d.prepare(q);
// Hesap ve Multi-Tenant tabloları (drizzle/0004_accounts.sql + supabase/schema.sql ile uyumlu).
export const accountDDL=[
 'CREATE TABLE IF NOT EXISTS tenants (id text PRIMARY KEY NOT NULL,name text NOT NULL,slug text NOT NULL,owner_id text NOT NULL,plan text DEFAULT \'free\' NOT NULL,created_at text NOT NULL)',
 'CREATE UNIQUE INDEX IF NOT EXISTS tenants_slug ON tenants (slug)',
 'CREATE TABLE IF NOT EXISTS tenant_members (tenant_id text NOT NULL,user_id text NOT NULL,role text DEFAULT \'owner\' NOT NULL,created_at text NOT NULL,PRIMARY KEY(tenant_id,user_id))',
 'CREATE INDEX IF NOT EXISTS tenant_members_user ON tenant_members (user_id)',
 'CREATE TABLE IF NOT EXISTS users (id text PRIMARY KEY NOT NULL,email text NOT NULL,name text NOT NULL,password_hash text,password_salt text,google_sub text,tenant_id text,created_at text NOT NULL,last_login_at text)',
 'CREATE UNIQUE INDEX IF NOT EXISTS users_email ON users (email)',
 'CREATE UNIQUE INDEX IF NOT EXISTS users_google_sub ON users (google_sub)',
 'CREATE TABLE IF NOT EXISTS sessions (id text PRIMARY KEY NOT NULL,user_id text NOT NULL,tenant_id text,sb_access_token text,sb_refresh_token text,created_at text NOT NULL,expires_at text NOT NULL,user_agent text DEFAULT \'\' NOT NULL)',
 'CREATE INDEX IF NOT EXISTS sessions_user ON sessions (user_id)',
 'CREATE TABLE IF NOT EXISTS password_resets (email text PRIMARY KEY NOT NULL,code_hash text NOT NULL,expires_at text NOT NULL,attempts integer DEFAULT 0 NOT NULL,created_at text NOT NULL)',
 'CREATE TABLE IF NOT EXISTS ai_usage (user_id text NOT NULL,day text NOT NULL,kind text NOT NULL,count integer DEFAULT 0 NOT NULL,PRIMARY KEY(user_id,day,kind))',
 'CREATE TABLE IF NOT EXISTS auth_attempts (key text PRIMARY KEY NOT NULL,count integer DEFAULT 0 NOT NULL,reset_at text NOT NULL)',
 'CREATE TABLE IF NOT EXISTS study_plans (user_id text PRIMARY KEY NOT NULL,config text NOT NULL,done text DEFAULT \'{}\' NOT NULL,off_days text DEFAULT \'{}\' NOT NULL,created_at text NOT NULL,updated_at text NOT NULL)'
];
export const SESSION_COOKIE='nd_session';
export const SESSION_DAYS=30;
export type SessionUser={
 id:string;
 email:string;
 name:string;
 admin:boolean;
 developer:boolean;
 hasPassword:boolean;
 google:boolean;
 tenantId:string;
 tenantName:string;
 tenantRole:'owner'|'admin'|'member';
 authProvider:'supabase'|'local';
 sbAccessToken?:string;
};
export function readCookie(request:Request,name:string){const raw=request.headers.get('cookie')||'';for(const part of raw.split(';')){const i=part.indexOf('=');if(i<0)continue;if(part.slice(0,i).trim()===name){try{return decodeURIComponent(part.slice(i+1).trim())}catch{return ''}}}return ''}
export async function sha256(text:string){const h=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return [...new Uint8Array(h)].map(b=>b.toString(16).padStart(2,'0')).join('')}
// Yönetici: netududev@gmail.com her zaman geliştirici ve yöneticidir; ayrıca ADMIN_EMAILS listesindekiler.
export function isAdmin(email:string,first:boolean){if(isDeveloper(email))return true;const list=(bindings().ADMIN_EMAILS||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);return list.length?list.includes(email.toLowerCase()):first}
// Oturum çerezinden kullanıcıyı ve aktif Tenant bilgisini bulur; Supabase Auth aktifse JWT oturumunu da doğrular.
export async function sessionUser(request:Request):Promise<SessionUser|null>{
 const token=readCookie(request,SESSION_COOKIE);
 if(!token||token.length<20||token.length>200)return null;
 await ensureSchema();
 const sid=await sha256(token);
 const row=await db().prepare('SELECT u.id,u.email,u.name,u.password_hash,u.google_sub,u.tenant_id,s.tenant_id AS session_tenant_id,s.sb_access_token,s.sb_refresh_token,(u.id=(SELECT id FROM users ORDER BY created_at,id LIMIT 1)) AS first FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.id=? AND s.expires_at>?').bind(sid,new Date().toISOString()).first();
 if(!row)return null;
 const userId=String(row.id);
 const email=String(row.email);
 const name=String(row.name);
 const supa=activeSupabaseConfig();
 let sbAccessToken=row.sb_access_token?String(row.sb_access_token):undefined;
 const sbRefreshToken=row.sb_refresh_token?String(row.sb_refresh_token):undefined;

 // Supabase bağlıysa ve oturumda Supabase Auth JWT varsa, Supabase Auth (/auth/v1/user) üzerinden doğrula / yenile
 if(supa&&sbAccessToken){
  const verified=await supabaseAuthGetUser(supa,sbAccessToken,sbRefreshToken);
  if(verified.user){
   if(verified.refreshed&&verified.user.accessToken){
    sbAccessToken=verified.user.accessToken;
    await db().prepare('UPDATE sessions SET sb_access_token=?,sb_refresh_token=? WHERE id=?').bind(verified.user.accessToken,verified.user.refreshToken||sbRefreshToken||null,sid).run().catch(()=>{});
   }
  }
 }

 const tInfo=await ensureUserTenant(db(),{userId,name,email});
 const effectiveTenantId=row.session_tenant_id?String(row.session_tenant_id):tInfo.tenantId;
 let tenantName=tInfo.tenantName;
 let tenantRole=tInfo.tenantRole;
 if(effectiveTenantId!==tInfo.tenantId){
  const mRow=await db().prepare('SELECT role FROM tenant_members WHERE tenant_id=? AND user_id=?').bind(effectiveTenantId,userId).first();
  const tRow=await db().prepare('SELECT name FROM tenants WHERE id=?').bind(effectiveTenantId).first();
  if(mRow&&tRow){
   tenantName=String(tRow.name);
   tenantRole=(String(mRow.role||'member') as 'owner'|'admin'|'member');
  }
 }
 const dev=isDeveloper(email);
 return {
  id:userId,
  email,
  name,
  admin:dev||isAdmin(email,!!row.first),
  developer:dev,
  hasPassword:!!row.password_hash||!!sbAccessToken,
  google:!!row.google_sub,
  tenantId:effectiveTenantId,
  tenantName,
  tenantRole,
  authProvider:supa?'supabase':'local',
  sbAccessToken
 };
}
export function sameOrigin(request:Request){if(['GET','HEAD'].includes(request.method))return;const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)throw new AppError('Bu istek kabul edilmedi.',403)}
export async function requireUser(request:Request):Promise<SessionUser>{sameOrigin(request);const u=await sessionUser(request);if(!u)throw new AppError('Oturumun kapalı. Devam etmek için giriş yap.',401);return u}
// Tüm çalışma verileri (sorular, denemeler, raporlar, ders notları, çalışma planı) kullanıcının aktif Tenant'ı (tenantId) kapsamında izole edilir.
export async function owner(request:Request){const u=await requireUser(request);return u.tenantId||u.id}
export function failure(e:unknown){if(e instanceof AppError)return Response.json({error:e.message},{status:e.status});console.error('study_request_failed',e instanceof Error?e.name+': '+e.message:'unknown');return Response.json({error:'İşlem tamamlanamadı. Bilgilerin korunuyor; tekrar deneyebilirsin.'},{status:500})}
export async function json(request:Request){if(Number(request.headers.get('content-length'))>2_000_000)throw new AppError('Gönderilen veri çok büyük.',413);return request.json()}
const parse=(v:unknown,fallback:unknown)=>{try{return v?JSON.parse(String(v)):fallback}catch{return fallback}};
export function unpack(row:Record<string,unknown>){const {user_id,analyzing_at,mime,...publicRow}=row;void user_id;void analyzing_at;void mime;return {...publicRow,mistake_type:row.mistake_type||'yanlış',review_stage:Number(row.review_stage||0),next_review:row.next_review||null,review_log:parse(row.review_log,[]),analysis:parse(row.analysis,null),image_key:row.image_key?'available':null}}
export async function mine(id:string,user:string){const row=await db().prepare('SELECT * FROM questions WHERE id = ? AND user_id = ?').bind(id,user).first();if(!row)throw new AppError('Soru bulunamadı.',404);return row}
export const aiReady=()=>!!bindings().OPENAI_API_KEY;
export const youtubeReady=()=>!!bindings().YOUTUBE_API_KEY;
export async function respond(input:unknown[],instructions:string,search=false){const {OPENAI_API_KEY,OPENAI_MODEL}=bindings();if(!OPENAI_API_KEY)throw new AppError('Yapay zekâ bağlantısı kurulmadı. Sorun arşivinde saklı; geliştirici hesabıyla (netududev@gmail.com) Ayarlar bölümünden OpenAI API bağlandıktan sonra çözebilirsin.',503);const model=OPENAI_MODEL||'gpt-4o-mini';const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model,store:false,instructions,input:search?input:[...input,{role:'user',content:'Yanıtı yalnızca geçerli JSON biçiminde ver.'}],max_output_tokens:6500,...(search?{tools:[{type:'web_search',filters:{allowed_domains:['youtube.com','youtu.be']}}],tool_choice:'required',include:['web_search_call.action.sources']}:{text:{format:{type:'json_object'}}})}),signal:AbortSignal.timeout(110000)});if(!response.ok){let detail='';try{const e=await response.json() as any;detail=String(e?.error?.message||'').slice(0,200);const code=String(e?.error?.code||'');if(code==='insufficient_quota'||/quota|billing/i.test(detail))throw new AppError('OpenAI bakiyen yok ya da bitmiş görünüyor. platform.openai.com › Billing bölümünden bakiye yükle.',402);if(code==='invalid_api_key'||response.status===401)throw new AppError('OpenAI anahtarı geçersiz. Ayarlar bölümündeki OpenAI API anahtarını kontrol et.',401);if(code==='model_not_found'||/model/i.test(detail)&&response.status===404)throw new AppError(`Seçili model bulunamadı (${model}). Ayarlar içindeki OpenAI Model değerini kontrol et. OpenAI mesajı: ${detail}`,502)}catch(e){if(e instanceof AppError)throw e}throw new AppError(response.status===429?'Yapay zekâ kullanım sınırına ulaşıldı. Bakiyeni kontrol et veya biraz sonra tekrar dene.':`Yapay zekâ bağlantısı yanıt vermedi (HTTP ${response.status}). ${detail||'Anahtarını ve model erişimini kontrol et.'}`,502)}const r=await response.json() as any;if(r.status!=='completed')throw new AppError('Çözüm tamamlanamadı; tekrar dene.',502);const text=(r.output||[]).flatMap((o:any)=>o.content||[]).filter((c:any)=>c.type==='output_text').map((c:any)=>c.text).join('\n');if(!text)throw new AppError('Çözüm üretilemedi. Daha net bir fotoğraf deneyebilirsin.',502);return {text,output:r.output}}
export const stripFence=(t:string)=>t.replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,'').trim();
export function isYouTubeUrl(url:string){try{const u=new URL(url);return u.protocol==='https:'&&((['www.youtube.com','youtube.com','m.youtube.com'].includes(u.hostname)&&u.pathname==='/watch'&&/^[\w-]{11}$/.test(u.searchParams.get('v')||''))||(u.hostname==='youtu.be'&&/^\/[\w-]{11}$/.test(u.pathname)))}catch{return false}}
export function isoDuration(iso:string){const m=/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso||'');if(!m)return '';const h=Number(m[1]||0),mi=Number(m[2]||0),s=Number(m[3]||0);return h?`${h}:${String(mi).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${mi}:${String(s).padStart(2,'0')}`}
