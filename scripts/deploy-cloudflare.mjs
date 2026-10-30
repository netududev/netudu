// Net Defterim'i kendi Cloudflare hesabına yayınlar (ücretsiz plan yeterli).
// Kullanım: npm run deploy:cloudflare   (Windows'ta cloudflare-yayinla.cmd dosyasına çift tıkla)
// Adımlar: giriş → D1 veritabanı → R2 deposu → derleme → yayın → gizli anahtarlar → veritabanı göçleri.
// Oluşturulan kaynak adları/ID'leri .cloudflare.json dosyasında saklanır (gizli bilgi değildir).
import {spawnSync} from 'node:child_process';
import {existsSync,readFileSync,writeFileSync,readdirSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
process.chdir(root);
const wranglerJs=path.join(root,'node_modules','wrangler','bin','wrangler.js');
const stateFile=path.join(root,'.cloudflare.json');
const state=existsSync(stateFile)?JSON.parse(readFileSync(stateFile,'utf8')):{};
state.worker??='net-defterim';state.d1Name??='net-defterim-db';state.r2??='net-defterim-fotograflar';state.applied??=[];
const save=()=>writeFileSync(stateFile,JSON.stringify(state,null,2)+'\n');
const step=(t)=>console.log('\n\x1b[36m▶ '+t+'\x1b[0m');
function wrangler(args,{capture=false,input,allowFail=false}={}){const r=spawnSync(process.execPath,[wranglerJs,...args],{cwd:root,encoding:'utf8',input,stdio:capture||input!==undefined?['pipe','pipe','pipe']:'inherit',env:{...process.env,WRANGLER_SEND_METRICS:'false'}});const out=(r.stdout||'')+(r.stderr||'');if(r.status!==0&&!allowFail){if(capture)console.error(out);throw new Error('wrangler '+args.join(' ')+' başarısız oldu.')}return {ok:r.status===0,out}}
function readEnv(){const f=path.join(root,'.env');if(!existsSync(f))return {};const o={};for(const line of readFileSync(f,'utf8').split(/\r?\n/)){const m=/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);if(m&&m[2])o[m[1]]=m[2].replace(/^["']|["']$/g,'')}return o}

try{
 if(!existsSync(wranglerJs))throw new Error('Bağımlılıklar kurulu değil. Önce: npm run install:ci');
 step('1/7 Cloudflare hesabı');
 if(!wrangler(['whoami'],{capture:true,allowFail:true}).out.match(/associated with the email|You are logged in/i)){console.log('Tarayıcıda Cloudflare girişi açılacak; "Allow" de.');wrangler(['login'])}

 step('2/7 D1 veritabanı ('+state.d1Name+')');
 if(!state.d1Id){const list=wrangler(['d1','list','--json'],{capture:true,allowFail:true});try{const hit=JSON.parse(list.out.slice(list.out.indexOf('['))).find(d=>d.name===state.d1Name);if(hit)state.d1Id=hit.uuid}catch{}
  if(!state.d1Id){const r=wrangler(['d1','create',state.d1Name],{capture:true});const m=r.out.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);if(!m)throw new Error('D1 kimliği okunamadı:\n'+r.out);state.d1Id=m[0]}save()}
 console.log('D1: '+state.d1Id);

 step('3/7 R2 fotoğraf deposu ('+state.r2+')');
 const r2=wrangler(['r2','bucket','create',state.r2],{capture:true,allowFail:true});
 if(!r2.ok&&!/already exists|already own/i.test(r2.out)){console.error(r2.out);throw new Error('R2 deposu oluşturulamadı. Cloudflare panelinde R2 bölümünü bir kez açıp etkinleştirmen gerekebilir (ücretsiz katman 10 GB).')}

 step('4/7 Derleme');
 const env={...process.env,CF_WORKER_NAME:state.worker,CF_D1_NAME:state.d1Name,CF_D1_ID:state.d1Id,CF_R2_BUCKET:state.r2};
 const b=spawnSync(process.execPath,[path.join(root,'scripts','run-framework.mjs'),'build'],{cwd:root,stdio:'inherit',env});if(b.status!==0)throw new Error('Derleme başarısız oldu.');
 const cfg=path.join(root,'dist','server','wrangler.json');

 step('5/7 Veritabanı göçleri');
 for(const f of readdirSync(path.join(root,'drizzle')).filter(f=>/^\d{4}_.*\.sql$/.test(f)).sort()){if(state.applied.includes(f))continue;console.log('  '+f);const r=wrangler(['d1','execute',state.d1Name,'--remote','--file',path.join('drizzle',f),'--config',cfg],{capture:true,allowFail:true});if(!r.ok&&!/already exists|duplicate column/i.test(r.out)){console.error(r.out);throw new Error(f+' uygulanamadı.')}state.applied.push(f);save()}

 step('6/7 Yayın');
 const d=wrangler(['deploy','--config',cfg],{capture:true});console.log(d.out.split('\n').filter(l=>/https:\/\/|Uploaded|Deployed/i.test(l)).join('\n'));
 const url=(d.out.match(/https:\/\/[a-z0-9.-]+\.workers\.dev/i)||[])[0];if(url){state.url=url;save()}

 step('7/7 Gizli anahtarlar');
 const e=readEnv();const secrets={};for(const k of ['OPENAI_API_KEY','OPENAI_MODEL','YOUTUBE_API_KEY','RESEND_API_KEY','SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','SUPABASE_ANON_KEY','SUPABASE_KEY','GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET','ADMIN_EMAILS','APP_URL','AI_LIMIT_SOLVE','AI_LIMIT_NOTE','AI_LIMIT_REPORT','AI_LIMIT_VIDEO','AI_LIMIT_QUOTE','REGISTRATION_OPEN'])if(e[k])secrets[k]=e[k];
 if(!secrets.APP_URL&&state.url)secrets.APP_URL=state.url;
 if(Object.keys(secrets).length){const dir=mkdtempSync(path.join(tmpdir(),'nd-'));const file=path.join(dir,'s.json');try{writeFileSync(file,JSON.stringify(secrets));wrangler(['secret','bulk',file,'--config',cfg],{capture:true})}finally{rmSync(dir,{recursive:true,force:true})}console.log('Yüklenen anahtar adları: '+Object.keys(secrets).join(', '))}else console.log('.env içinde anahtar bulunamadı; yapay zekâ kapalı yayınlandı.');

 console.log('\n\x1b[32m✔ Yayında: '+(state.url||'Cloudflare panelinde Workers & Pages bölümüne bak')+'\x1b[0m');
 if(state.url)console.log('Google girişi için yönlendirme adresi: '+state.url+'/api/auth/google/callback');
 console.log('İlk açılan hesap yönetici olur ve sınırsız yapay zekâ hakkı alır (ADMIN_EMAILS ile değiştirilebilir).');
}catch(err){console.error('\n\x1b[31m✖ '+err.message+'\x1b[0m');process.exitCode=1}
