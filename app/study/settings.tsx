"use client";
import {useEffect,useRef,useState} from 'react';
import {Sparkles,Bell,Download,ArrowUpRight,DatabaseBackup,Upload,LoaderCircle,LogOut,UserRound,Check,KeyRound,Trash2,ShieldCheck,CalendarDays,Wand2,BellRing,Database,RefreshCw,Copy,Unplug,Building2,UserPlus,Plus,Terminal,AlertCircle,Users,Search,Sun} from 'lucide-react';
import {ThemeSwitch} from './theme';
import {AlertDialog,AlertDialogContent,AlertDialogHeader,AlertDialogTitle,AlertDialogDescription,AlertDialogFooter,AlertDialogCancel} from '@/components/ui/alert-dialog';
import {toast} from 'sonner';
import {daysUntil,defaultExamYear,estimatedExamDate,initials,type Profile} from '@/lib/study';
import {useStudy,api,postJson,Choice,kindLabel,writeSetting,authHeaders,type AiKind} from './shared';
import {planStats,TEMPO_OPTIONS,SPORT_PROGRAMS} from '@/lib/plan/scheduler';
import {testAlarm,askNotificationPermission} from './plan/alarm';
import {localToday,shortDate} from './plan/ui';

const SUPABASE_DDL=`CREATE TABLE IF NOT EXISTS public.tenants (id text PRIMARY KEY,name text NOT NULL,slug text NOT NULL UNIQUE,owner_id text NOT NULL,plan text NOT NULL DEFAULT 'free',created_at text NOT NULL);
CREATE TABLE IF NOT EXISTS public.tenant_members (tenant_id text NOT NULL,user_id text NOT NULL,role text NOT NULL DEFAULT 'owner',created_at text NOT NULL,PRIMARY KEY (tenant_id, user_id));
CREATE INDEX IF NOT EXISTS tenant_members_user_idx ON public.tenant_members (user_id);
CREATE TABLE IF NOT EXISTS public.users (id text PRIMARY KEY,email text NOT NULL UNIQUE,name text NOT NULL,password_hash text,password_salt text,google_sub text UNIQUE,tenant_id text,created_at text NOT NULL,last_login_at text);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS tenant_id text;
CREATE TABLE IF NOT EXISTS public.sessions (id text PRIMARY KEY,user_id text NOT NULL,tenant_id text,sb_access_token text,sb_refresh_token text,created_at text NOT NULL,expires_at text NOT NULL,user_agent text NOT NULL DEFAULT '');
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS tenant_id text;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS sb_access_token text;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS sb_refresh_token text;
CREATE INDEX IF NOT EXISTS sessions_user_idx ON public.sessions (user_id);
CREATE TABLE IF NOT EXISTS public.questions (id text PRIMARY KEY,user_id text NOT NULL,exam text NOT NULL,exam_type text NOT NULL,date text NOT NULL,subject text NOT NULL,topic text NOT NULL,question text NOT NULL,my_answer text NOT NULL DEFAULT '',answer_key text NOT NULL DEFAULT '',image_key text,mime text,analysis text,reviewed integer NOT NULL DEFAULT 0,created_at text NOT NULL,analyzing_at text,mistake_type text NOT NULL DEFAULT 'yanlış',review_stage integer NOT NULL DEFAULT 0,next_review text,review_log text NOT NULL DEFAULT '[]');
CREATE INDEX IF NOT EXISTS questions_user_date_idx ON public.questions (user_id, date);
CREATE INDEX IF NOT EXISTS questions_user_next_review_idx ON public.questions (user_id, next_review);
CREATE TABLE IF NOT EXISTS public.reports (id text PRIMARY KEY,user_id text NOT NULL,month text NOT NULL,notes text NOT NULL,updated_at text NOT NULL,goals text NOT NULL DEFAULT '[]',UNIQUE (user_id, month));
CREATE TABLE IF NOT EXISTS public.exams (id text PRIMARY KEY,user_id text NOT NULL,name text NOT NULL,exam_type text NOT NULL,date text NOT NULL,net double precision NOT NULL,correct integer,wrong integer,blank integer,notes text NOT NULL DEFAULT '',created_at text NOT NULL);
CREATE INDEX IF NOT EXISTS exams_user_date_idx ON public.exams (user_id, date);
CREATE TABLE IF NOT EXISTS public.video_cache (id text PRIMARY KEY,user_id text NOT NULL,subject text NOT NULL,topic text NOT NULL,videos text NOT NULL DEFAULT '[]',rejected text NOT NULL DEFAULT '[]',updated_at text NOT NULL,UNIQUE (user_id, subject, topic));
CREATE TABLE IF NOT EXISTS public.study_notes (id text PRIMARY KEY,user_id text NOT NULL,subject text NOT NULL,topic text NOT NULL,exam_type text NOT NULL DEFAULT '',content text NOT NULL,prompt text NOT NULL DEFAULT '',updated_at text NOT NULL,UNIQUE (user_id, subject, topic));
CREATE TABLE IF NOT EXISTS public.profiles (user_id text PRIMARY KEY,name text NOT NULL,grade text NOT NULL DEFAULT '10',target text NOT NULL DEFAULT '',exam_year integer NOT NULL DEFAULT 2028,exam_date text NOT NULL DEFAULT '2028-06-17',motto text NOT NULL DEFAULT '',daily_goal integer NOT NULL DEFAULT 0,school text NOT NULL DEFAULT '',updated_at text NOT NULL);
CREATE TABLE IF NOT EXISTS public.ai_usage (user_id text NOT NULL,day text NOT NULL,kind text NOT NULL,count integer NOT NULL DEFAULT 0,PRIMARY KEY (user_id, day, kind));
CREATE TABLE IF NOT EXISTS public.auth_attempts (key text PRIMARY KEY,count integer NOT NULL DEFAULT 0,reset_at text NOT NULL);
CREATE TABLE IF NOT EXISTS public.password_resets (email text PRIMARY KEY,code_hash text NOT NULL,expires_at text NOT NULL,attempts integer NOT NULL DEFAULT 0,created_at text NOT NULL);
CREATE TABLE IF NOT EXISTS public.study_plans (user_id text PRIMARY KEY,config text NOT NULL,done text NOT NULL DEFAULT '{}',off_days text NOT NULL DEFAULT '{}',created_at text NOT NULL,updated_at text NOT NULL);
INSERT INTO storage.buckets (id, name, public) VALUES ('question-images', 'question-images', false) ON CONFLICT (id) DO NOTHING;`;

type AiStatus={connected:boolean;source:'env'|'runtime'|'none';model:string;maskedKey:string;youtubeConnected:boolean;youtubeMaskedKey?:string;resendConnected?:boolean;resendMaskedKey?:string};
type RegisteredUser={id:string;email:string;name:string;developer:boolean;hasPassword:boolean;google:boolean;tenantId:string;tenantName:string;grade:string;target:string;school:string;examYear:number;questionCount:number;examCount:number;hasPlan:boolean;createdAt:string;lastLoginAt:string|null};
type SupaState={connected:boolean;url:string;maskedKey?:string;keyType?:string;source:'env'|'runtime'|'none';tablesReady:boolean;authReady?:boolean;tenantReady?:boolean;synced?:number;message:string;ai?:AiStatus;users?:RegisteredUser[]};
type TenantItem={id:string;name:string;slug:string;role:'owner'|'admin'|'member';plan:string;ownerId:string;createdAt:string};
type TenantMember={userId:string;email:string;name:string;role:'owner'|'admin'|'member';createdAt:string};
type TenantPayload={active:TenantItem;tenants:TenantItem[];members:TenantMember[];authProvider:'supabase'|'local';message?:string;error?:string};
type NoticeBox={type:'good'|'bad';text:string}|null;

const roleLabel:Record<string,string>={owner:'Sahip',admin:'Yönetici',member:'Üye'};

export function SettingsView(){const s=useStudy();const {ai,youtube,user}=s;const isDev=!!user?.developer;const fileInput=useRef<HTMLInputElement>(null);const [restoring,setRestoring]=useState(false);const [form,setForm]=useState<Profile>(s.profile);const [saving,setSaving]=useState(false);const [pw,setPw]=useState({current:'',next:''}),[pwBusy,setPwBusy]=useState(false),[del,setDel]=useState(false),[delForm,setDelForm]=useState({confirm:'',password:''}),[delBusy,setDelBusy]=useState(false);
 const [supa,setSupa]=useState<SupaState|null>(null),[supaForm,setSupaForm]=useState({url:'',key:''}),[supaBusy,setSupaBusy]=useState(false),[supaNotice,setSupaNotice]=useState<NoticeBox>(null);
 const [aiForm,setAiForm]=useState({openaiKey:'',openaiModel:'gpt-4o-mini',youtubeKey:'',resendKey:''}),[aiBusy,setAiBusy]=useState(false),[aiNotice,setAiNotice]=useState<NoticeBox>(null);
 const [userSearch,setUserSearch]=useState(''),[usersBusy,setUsersBusy]=useState(false);
 const [tState,setTState]=useState<TenantPayload|null>(null),[tBusy,setTBusy]=useState(false),[newTenantName,setNewTenantName]=useState(''),[memberForm,setMemberForm]=useState({email:'',role:'member'});
 useEffect(()=>{setForm(s.profile)},[s.profile]);
 useEffect(()=>{
  if(isDev){
   fetch('/api/supabase',{credentials:'include',headers:authHeaders()}).then(r=>r.json() as Promise<SupaState>).then(d=>{
    setSupa(d);
    if(d.url)setSupaForm(f=>({...f,url:d.url}));
    if(d.ai?.model)setAiForm(f=>({...f,openaiModel:d.ai!.model}));
    if(d.connected){
     setSupaNotice({type:'good',text:d.message||'Supabase bağlantısı aktif!'});
    }
    if(d.ai?.connected){
     setAiNotice({type:'good',text:`OpenAI API (${d.ai.model}${d.ai.maskedKey?' · '+d.ai.maskedKey:''}) bağlı ve aktif!`});
    }
   }).catch(()=>{});
  }
  fetch('/api/tenant',{credentials:'include',headers:authHeaders()}).then(r=>r.json() as Promise<TenantPayload>).then(d=>{if(d?.active)setTState(d)}).catch(()=>{});
 },[isDev]);
 async function saveOpenAi(e:React.FormEvent){
  e.preventDefault();setAiBusy(true);setAiNotice(null);
  try{
   const r=await fetch('/api/supabase',{method:'POST',credentials:'include',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify({action:'save_openai',...aiForm})});
   const d=await r.json() as {ai?:AiStatus;message?:string;error?:string};
   if(!r.ok)throw new Error(d.error||'OpenAI API bağlanamadı.');
   setSupa(prev=>prev?{...prev,ai:d.ai}:{connected:false,url:'',source:'none',tablesReady:false,message:'',ai:d.ai});
   setAiForm(f=>({...f,openaiKey:'',youtubeKey:'',resendKey:''}));
   const msg=d.message||'OpenAI API başarıyla bağlandı!';
   setAiNotice({type:'good',text:msg});
   toast.success(msg);
   await s.reload();
  }catch(err){
   const msg=(err as Error).message;
   setAiNotice({type:'bad',text:msg});
   toast.error(msg);
  }finally{setAiBusy(false)}
 }
 async function disconnectOpenAi(){
  if(!confirm('OpenAI API bağlantısı kaldırılsın mı?'))return;
  setAiBusy(true);setAiNotice(null);
  try{
   const r=await fetch('/api/supabase',{method:'POST',credentials:'include',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify({action:'disconnect_openai'})});
   const d=await r.json() as {ai?:AiStatus;message?:string;error?:string};
   if(!r.ok)throw new Error(d.error||'İşlem tamamlanamadı.');
   setSupa(prev=>prev?{...prev,ai:d.ai}:prev);
   setAiNotice({type:'bad',text:d.message||'OpenAI API bağlantısı kaldırıldı.'});
   toast.message(d.message||'OpenAI API bağlantısı kaldırıldı.');
   await s.reload();
  }catch(err){
   const msg=(err as Error).message;
   setAiNotice({type:'bad',text:msg});
   toast.error(msg);
  }finally{setAiBusy(false)}
 }
 async function saveSupabase(e:React.FormEvent){
  e.preventDefault();setSupaBusy(true);setSupaNotice(null);
  try{
   const r=await fetch('/api/supabase',{method:'POST',credentials:'include',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify(supaForm)});
   const d=await r.json() as SupaState&{error?:string};
   if(!r.ok)throw new Error(d.error||'Supabase bağlanamadı.');
   setSupa(d);
   setSupaForm(f=>({url:d.url||f.url,key:''}));
   const msg=d.message||'Supabase başarıyla bağlandı!';
   setSupaNotice({type:'good',text:msg});
   toast.success(msg);
   await s.reload();
   const td=await fetch('/api/tenant',{credentials:'include',headers:authHeaders()}).then(x=>x.json() as Promise<TenantPayload>).catch(()=>null);
   if(td?.active)setTState(td);
  }catch(err){
   const msg=(err as Error).message;
   setSupaNotice({type:'bad',text:msg});
   toast.error(msg);
  }finally{setSupaBusy(false)}
 }
 async function syncSupabase(){
  setSupaBusy(true);
  try{
   const r=await fetch('/api/supabase',{method:'POST',credentials:'include',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify({action:'sync'})});
   const d=await r.json() as {message?:string;error?:string};
   if(!r.ok)throw new Error(d.error||'Senkronizasyon başarısız.');
   const msg=d.message||'Veriler Supabase ile senkronize edildi.';
   setSupaNotice({type:'good',text:msg});
   toast.success(msg);
   const st=await fetch('/api/supabase',{credentials:'include',headers:authHeaders()}).then(x=>x.json() as Promise<SupaState>);
   setSupa(st);
  }catch(err){
   const msg=(err as Error).message;
   setSupaNotice({type:'bad',text:msg});
   toast.error(msg);
  }finally{setSupaBusy(false)}
 }
 async function disconnectSupabase(){
  if(!confirm('Supabase bağlantısı kaldırılıp yerel D1 veritabanına dönülsün mü?'))return;
  setSupaBusy(true);
  try{
   const r=await fetch('/api/supabase',{method:'DELETE',credentials:'include',headers:authHeaders()});
   const d=await r.json() as SupaState;
   setSupa(d);
   setSupaForm({url:'',key:''});
   setSupaNotice({type:'bad',text:d.message||'Supabase bağlantısı kaldırıldı.'});
   toast.message(d.message);
   await s.reload();
  }catch(err){
   const msg=(err as Error).message;
   setSupaNotice({type:'bad',text:msg});
   toast.error(msg);
  }finally{setSupaBusy(false)}
 }
 async function runTenantOp(body:Record<string,unknown>,reloadAll=false){
  setTBusy(true);
  try{
   const r=await fetch('/api/tenant',{method:'POST',credentials:'include',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify(body)});
   const d=await r.json() as TenantPayload;
   if(!r.ok)throw new Error(d.error||'İşlem tamamlanamadı.');
   setTState(d);
   if(d.message)toast.success(d.message);
   if(reloadAll)await s.reload();
  }catch(err){
   toast.error((err as Error).message);
  }finally{
   setTBusy(false);
  }
 }
 async function saveProfile(e:React.FormEvent){e.preventDefault();setSaving(true);try{const d=await postJson('/api/profile',{...form,examYear:Number(form.examYear),dailyGoal:Number(form.dailyGoal)||0},'PUT');s.setProfile(d.profile);if(user?.email&&d.profile)writeSetting('profile:'+user.email.toLowerCase(),JSON.stringify(d.profile));toast.success('Profil kaydedildi.')}catch(err){toast.error((err as Error).message)}finally{setSaving(false)}}
 async function changePassword(e:React.FormEvent){e.preventDefault();setPwBusy(true);try{await postJson('/api/auth/password',pw);setPw({current:'',next:''});toast.success(user?.hasPassword?'Şifren değiştirildi; diğer cihazlardaki oturumlar kapatıldı.':'Şifren oluşturuldu; artık e-posta ve şifreyle de girebilirsin.');await s.reload()}catch(err){toast.error((err as Error).message)}finally{setPwBusy(false)}}
 async function deleteAccount(){setDelBusy(true);try{await api('/api/auth/account',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify(delForm)});toast.success('Hesabın ve tüm verilerin silindi.');setDel(false);await s.logout()}catch(err){toast.error((err as Error).message)}finally{setDelBusy(false)}}
 async function resetPlan(){if(!confirm('Ders çalışma programın silinsin mi? Tamamlandı ve kaydırma işaretleri de silinir; yanlış arşivin etkilenmez.'))return;try{await api('/api/plan',{method:'DELETE'});s.setPlan(null);toast.success('Program silindi. İstediğin zaman yeniden oluşturabilirsin.')}catch(err){toast.error((err as Error).message)}}
 async function notif(){const r=await askNotificationPermission();toast.message(r==='granted'?'Bildirimlere izin verildi.':r==='unsupported'?'Bu tarayıcı bildirimleri desteklemiyor.':'Bildirim izni verilmedi; tarayıcı ayarlarından açabilirsin.')}
 async function restore(f?:File){if(!f)return;setRestoring(true);try{const text=await f.text();const parsed=JSON.parse(text);if(parsed?.app!=='netudu'&&parsed?.app!=='net-defterim')throw new Error('Bu dosya netudu yedeği değil.');const d=await api('/api/import',{method:'POST',headers:{'Content-Type':'application/json'},body:text});await s.reload();toast.success(`${d.added} kayıt geri yüklendi (${d.received} kayıt okundu; mevcut olanlar korundu).`)}catch(e){toast.error((e as Error).message)}finally{setRestoring(false);if(fileInput.current)fileInput.current.value=''}}
 async function refreshUsers(){
  setUsersBusy(true);
  try{
   const r=await fetch('/api/supabase',{method:'POST',credentials:'include',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify({action:'list_users'})});
   const d=await r.json() as {users?:RegisteredUser[];error?:string};
   if(!r.ok)throw new Error(d.error||'Kullanıcı listesi alınamadı.');
   setSupa(prev=>prev?{...prev,users:d.users||[]}:null);
   toast.success(`Kayıtlı kullanıcı listesi güncellendi (${(d.users||[]).length} hesap).`);
  }catch(err){
   toast.error((err as Error).message);
  }finally{
   setUsersBusy(false);
  }
 }
 const allUsers=supa?.users||[];
 const filteredUsers=allUsers.filter(u=>{
  const q=userSearch.trim().toLocaleLowerCase('tr');
  if(!q)return true;
  return (u.name||'').toLocaleLowerCase('tr').includes(q)||(u.email||'').toLocaleLowerCase('tr').includes(q)||(u.school||'').toLocaleLowerCase('tr').includes(q)||(u.target||'').toLocaleLowerCase('tr').includes(q)||(u.tenantName||'').toLocaleLowerCase('tr').includes(q);
 });
 return <div className="settings-grid">
  {isDev&&<>
   <article className="panel profile-panel"><span className="settings-icon"><Users/></span><h2>Kayıtlı Kullanıcılar & Hesap Yönetimi (Developer Özel)</h2>
    <span className="status good">Toplam {allUsers.length} Kayıtlı Hesap · {allUsers.filter(u=>u.developer).length} Developer · {allUsers.filter(u=>u.hasPlan).length} Aktif Program</span>
    <p className="description">Bu panel yalnızca yetkili geliştirici (<code>yusufykykaya@gmail.com</code>, <code>batur2864@hotmail.com</code>, <code>netududev@gmail.com</code>) hesaplarında görünür. Uygulamada hesap açan tüm kullanıcıları, sınıflarını, çalışma alanlarını ve etkinlik istatistiklerini buradan takip edebilirsin.</p>
    <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center',marginBottom:14}}>
     <div className="search-field" style={{flex:1,minWidth:220}}><Search size={16}/><input placeholder="Kullanıcı adı, e-posta, okul, hedef veya çalışma alanı ara..." value={userSearch} onChange={e=>setUserSearch(e.target.value)}/></div>
     <button type="button" className="secondary" disabled={usersBusy} onClick={()=>void refreshUsers()}>{usersBusy?<LoaderCircle className="spin" size={16}/>:<RefreshCw size={16}/>} Listeyi Yenile ({filteredUsers.length}/{allUsers.length})</button>
    </div>
    {filteredUsers.length===0?(
     <p className="muted" style={{padding:'12px 0'}}>Aramana uygun kayıtlı kullanıcı bulunamadı.</p>
    ):(
     <div className="table-scroll" style={{display:'block',maxHeight:420,overflowY:'auto',border:'1px solid #333a41',borderRadius:10}}>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
       <thead>
        <tr style={{background:'#1f2428',textAlign:'left',borderBottom:'1px solid #333a41',color:'#8f9aa3'}}>
         <th style={{padding:'10px 12px'}}>Kullanıcı & E-posta</th>
         <th style={{padding:'10px 12px'}}>Sınıf · Hedef · Okul</th>
         <th style={{padding:'10px 12px'}}>Çalışma Alanı (Tenant)</th>
         <th style={{padding:'10px 12px'}}>Etkinlik</th>
         <th style={{padding:'10px 12px'}}>Kayıt / Son Giriş</th>
        </tr>
       </thead>
       <tbody>
        {filteredUsers.map(u=>(
         <tr key={u.id} style={{borderBottom:'1px solid #2c3238'}}>
          <td style={{padding:'10px 12px'}}>
           <strong style={{display:'block',color:'#e7eaed'}}>{u.name} {u.developer&&<span className="tag">Developer</span>} {u.google&&<span className="tag">Google</span>}</strong>
           <small style={{color:'#9aa5ae'}}>{u.email}</small>
          </td>
          <td style={{padding:'10px 12px',color:'#c3ccd3'}}>
           <span>{u.grade==='Mezun'?'Mezun':`${u.grade}. sınıf`} · YKS {u.examYear}</span>
           {(u.target||u.school)&&<small style={{display:'block',color:'#9aa5ae'}}>{[u.target,u.school].filter(Boolean).join(' · ')}</small>}
          </td>
          <td style={{padding:'10px 12px',color:'#c3ccd3'}}>{u.tenantName}</td>
          <td style={{padding:'10px 12px',color:'#c3ccd3'}}>
           <b>{u.questionCount}</b> soru · <b>{u.examCount}</b> deneme
           <small style={{display:'block',color:u.hasPlan?'#5fd0b6':'#9aa5ae'}}>{u.hasPlan?'Programı aktif':'Program oluşturmadı'}</small>
          </td>
          <td style={{padding:'10px 12px',color:'#9aa5ae',fontSize:12}}>
           <div>Kayıt: {u.createdAt?new Date(u.createdAt).toLocaleDateString('tr-TR',{day:'numeric',month:'short',year:'numeric'}):'—'}</div>
           <div>Son: {u.lastLoginAt?new Date(u.lastLoginAt).toLocaleString('tr-TR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):'—'}</div>
          </td>
         </tr>
        ))}
       </tbody>
      </table>
     </div>
    )}
   </article>

   <article className="panel profile-panel"><span className="settings-icon"><Terminal/></span><h2>OpenAI API & Yapay Zekâ Bağlantısı (Developer Özel)</h2>
    <span className={'status '+(ai?'good':'pending')}>{ai?`OpenAI API Bağlı (${supa?.ai?.model||'gpt-4o-mini'}${supa?.ai?.maskedKey?' · '+supa.ai.maskedKey:''})`:'OpenAI API Henüz Bağlanmadı'}</span>
    <p className="description">Bu panel yalnızca yetkili geliştirici hesaplarıyla (<code>yusufykykaya@gmail.com</code>, <code>batur2864@hotmail.com</code>, <code>netududev@gmail.com</code>) giriş yapıldığında görünür. OpenAI API anahtarını bağladığında tüm kullanıcılar için fotoğraftan soru çözümü, ders notu üretimi ve aylık rapor aktif olur.</p>
    {aiBusy&&<div className="verify good" role="status"><LoaderCircle className="spin" size={18}/><span>OpenAI API anahtarı doğrulanıyor ve sunucuya kaydediliyor...</span></div>}
    {!aiBusy&&aiNotice&&<div className={'verify '+aiNotice.type} role="alert">{aiNotice.type==='good'?<Check size={18}/>:<AlertCircle size={18}/>}<span><b>{aiNotice.type==='good'?'Bağlantı Aktif: ':'Bağlantı Hatası: '}</b>{aiNotice.text}</span></div>}
    {ai&&<ul className="kv">
     <li><span>OpenAI Bağlantı Durumu</span><b style={{color:'#5fd0b6'}}>Bağlandı ve Aktif</b></li>
     <li><span>Kayıtlı OpenAI API Anahtarı</span><b><code>{supa?.ai?.maskedKey||'Kayıtlı'}</code></b></li>
     <li><span>Aktif Yapay Zekâ Modeli</span><b><code>{supa?.ai?.model||'gpt-4o-mini'}</code></b></li>
     <li><span>YouTube Data API v3</span><b>{youtube?`Bağlı (${supa?.ai?.youtubeMaskedKey||'Kayıtlı'})`:'Varsayılan Müfredat Videoları Aktif'}</b></li>
     <li><span>Resend E-posta Servisi (Şifre Sıfırlama Kodu)</span><b>{supa?.ai?.resendConnected?`Bağlı (${supa.ai.resendMaskedKey||'Kayıtlı'})`:'Supabase Auth / Hızlı Kod Aktif'}</b></li>
     <li><span>Aktif Özellikler</span><b>Fotoğraftan Soru Çözümü · Ders Notu · Aylık Rapor</b></li>
    </ul>}
    <form onSubmit={saveOpenAi} className="pw-form">
     <div className="form-grid">
      <label>OpenAI API Key (sk-...)<input required type="password" placeholder={ai?`Mevcut anahtar bağlı (${supa?.ai?.maskedKey||'sk-...'}) — değiştirmek için yeni gir`:'sk-proj-...'} value={aiForm.openaiKey} onChange={e=>setAiForm({...aiForm,openaiKey:e.target.value})}/></label>
      <label>OpenAI Model<input required placeholder="gpt-4o-mini" value={aiForm.openaiModel} onChange={e=>setAiForm({...aiForm,openaiModel:e.target.value})}/></label>
      <label>YouTube Data API v3 Key <small>(isteğe bağlı)</small><input type="password" placeholder={youtube?`Mevcut anahtar bağlı (${supa?.ai?.youtubeMaskedKey||'AIza...'})`:'AIzaSy...'} value={aiForm.youtubeKey} onChange={e=>setAiForm({...aiForm,youtubeKey:e.target.value})}/></label>
      <label>Resend E-posta API Key <small>(isteğe bağlı · re_...)</small><input type="password" placeholder={supa?.ai?.resendConnected?`Mevcut bağlı (${supa?.ai?.resendMaskedKey||'re_...'})`:'re_... (Şifre sıfırlama e-postaları için)'} value={aiForm.resendKey} onChange={e=>setAiForm({...aiForm,resendKey:e.target.value})}/></label>
     </div>
     <div className="actions wrap">
      <button type="submit" className="primary" disabled={aiBusy}>{aiBusy?<LoaderCircle className="spin" size={16}/>:<Check size={16}/>} {ai?'OpenAI API bağlantısını güncelle':'OpenAI API bağla ve doğrula'}</button>
      {ai&&supa?.ai?.source==='runtime'&&<button type="button" className="danger-button inline" disabled={aiBusy} onClick={()=>void disconnectOpenAi()}><Unplug size={16}/> OpenAI bağlantısını kaldır</button>}
     </div>
    </form>
   </article>

   <article className="panel profile-panel"><span className="settings-icon"><Database/></span><h2>Supabase Auth, Multi-Tenant & Arka Uç Bağlantısı (Developer Özel)</h2>
    <span className={'status '+(supa?.connected?'good':'pending')}>{supa?.connected?(supa.tablesReady?'Supabase Bağlı ve Aktif (Auth + Tenant RLS + PostgreSQL + Storage)':'Supabase Bağlı (Auth Aktif · Tablo Şeması Bekleniyor)'):'Yerel D1 (SQLite) Modu'}</span>
    <p className="description">Supabase bağlantısı yalnızca yetkili geliştirici hesaplarıyla (<code>yusufykykaya@gmail.com</code>, <code>batur2864@hotmail.com</code>, <code>netududev@gmail.com</code>) yapılandırılabilir. Supabase Project URL ve API anahtarını girdiğinde tüm kimlik doğrulama (Authentication), çalışma alanı (Tenant) yönetimi ve veriler Supabase üzerinde yürütülür.</p>
    {supaBusy&&<div className="verify good" role="status"><LoaderCircle className="spin" size={18}/><span>Supabase sunucusuna bağlanılıyor, Project URL ve API anahtarı test ediliyor...</span></div>}
    {!supaBusy&&supaNotice&&<div className={'verify '+supaNotice.type} role="alert">{supaNotice.type==='good'?<Check size={18}/>:<AlertCircle size={18}/>}<span><b>{supaNotice.type==='good'?'Supabase Bağlandı: ':'Supabase Bağlantı Uyarısı: '}</b>{supaNotice.text}</span></div>}
    {supa?.connected&&<ul className="kv">
     <li><span>Supabase Bağlantı Durumu</span><b style={{color:'#5fd0b6'}}>Bağlandı ve Aktif</b></li>
     <li><span>Bağlı Project URL</span><b><code>{supa.url}</code></b></li>
     <li><span>Bağlı API Anahtarı</span><b><code>{supa.maskedKey||'Kayıtlı'}</code> {supa.keyType?`(${supa.keyType})`:''}</b></li>
     <li><span>Supabase Auth (/auth/v1)</span><b>{supa.authReady!==false?'Aktif':'Bağlı'}</b></li>
     <li><span>PostgreSQL & Multi-Tenant Tabloları</span><b>{supa.tablesReady?'Hazır ve Senkronize':'Tablolar için SQL Şemasını Çalıştırın (Yerel D1 Yedekli)'}</b></li>
    </ul>}
    <form onSubmit={saveSupabase} className="pw-form">
     <div className="form-grid">
      <label>Supabase Project URL<input required placeholder="https://xxxx.supabase.co" value={supaForm.url} onChange={e=>setSupaForm({...supaForm,url:e.target.value})}/></label>
      <label>Supabase API Key (service_role, anon, sb_secret_... veya sb_publishable_...)<input required type="password" placeholder={supa?.connected?`Mevcut anahtar bağlı (${supa.maskedKey||'kayıtlı'}) — değiştirmek için yeni gir`:'eyJhbGci... veya sb_secret_... / sb_publishable_...'} value={supaForm.key} onChange={e=>setSupaForm({...supaForm,key:e.target.value})}/></label>
     </div>
     <div className="actions wrap">
      <button type="submit" className="primary" disabled={supaBusy}>{supaBusy?<LoaderCircle className="spin" size={16}/>:<Check size={16}/>} {supa?.connected?'Supabase bağlantısını güncelle':'Supabase\'i bağla ve test et'}</button>
      <button type="button" className="secondary" onClick={()=>{void navigator.clipboard.writeText(SUPABASE_DDL);toast.success('Supabase Auth + Tenant + Veri SQL şeması panoya kopyalandı! Supabase SQL Editor ekranına yapıştırıp çalıştırabilirsin.')}}><Copy size={16}/> SQL şemasını kopyala (supabase/schema.sql)</button>
      {supa?.connected&&<button type="button" className="secondary" disabled={supaBusy} onClick={()=>void syncSupabase()}><RefreshCw size={16}/> Mevcut verileri Supabase'e aktar</button>}
      {supa?.connected&&supa.source==='runtime'&&<button type="button" className="danger-button inline" disabled={supaBusy} onClick={()=>void disconnectSupabase()}><Unplug size={16}/> Bağlantıyı kaldır</button>}
     </div>
     <p className="inline-note">İpucu: Tabloları ve Row Level Security (RLS) politikalarını oluşturmak için <code>supabase/schema.sql</code> dosyasını (veya <b>SQL şemasını kopyala</b> düğmesini) Supabase Dashboard › SQL Editor içinde bir kez çalıştır.</p>
    </form>
   </article>
  </>}

  <article className="panel profile-panel"><span className="settings-icon"><Building2/></span><h2>Çalışma Alanı / Kurum (Tenant) Yönetimi</h2>
   <span className="status good">{tState?.active?.name||user?.tenantName||'Kişisel Çalışma Alanı'} · {roleLabel[tState?.active?.role||user?.tenantRole||'owner']}</span>
   <p className="description">Tüm soruların, deneme netlerin, ders çalışma programın ve raporların aktif çalışma alanına (<code>tenant_id</code>) bağlıdır. Birden fazla çalışma alanı oluşturabilir veya aynı çalışma alanına ekip/sınıf arkadaşı ekleyebilirsin.</p>
   {tState&&<>
    <div className="form-grid">
     <label>Aktif Çalışma Alanı (Tenant) Değiştir
      <select className="choice-native" disabled={tBusy} value={tState.active.id} onChange={e=>void runTenantOp({action:'switch',tenantId:e.target.value},true)}>
       {tState.tenants.map(t=><option key={t.id} value={t.id}>{t.name} ({roleLabel[t.role]||t.role})</option>)}
      </select>
     </label>
     <label>Yeni Çalışma Alanı (Tenant) Oluştur
      <div style={{display:'flex',gap:8}}>
       <input maxLength={80} placeholder="Örn. 12-A Sayısal Sınıfı veya Mezun Kampı" value={newTenantName} onChange={e=>setNewTenantName(e.target.value)}/>
       <button type="button" className="secondary" disabled={tBusy||newTenantName.trim().length<2} onClick={()=>{const n=newTenantName.trim();setNewTenantName('');void runTenantOp({action:'create',name:n},true)}}><Plus size={16}/> Oluştur</button>
      </div>
     </label>
    </div>
    {(tState.active.role==='owner'||tState.active.role==='admin')&&<form className="pw-form" onSubmit={e=>{e.preventDefault();if(!memberForm.email.trim())return;const em=memberForm.email.trim();const rl=memberForm.role;setMemberForm({email:'',role:'member'});void runTenantOp({action:'add_member',email:em,role:rl},false)}}>
     <h3><UserPlus size={16}/> Çalışma alanına üye ekle</h3>
     <div className="form-grid">
      <label>Üye E-posta Adresi<input type="email" required placeholder="ogrenci@eposta.com" value={memberForm.email} onChange={e=>setMemberForm({...memberForm,email:e.target.value})}/></label>
      <label>Yetki Rolü
       <select className="choice-native" value={memberForm.role} onChange={e=>setMemberForm({...memberForm,role:e.target.value})}>
        <option value="member">Üye (Soru & Program Paylaşımı)</option>
        <option value="admin">Yönetici (Üye Ekleyebilir)</option>
       </select>
      </label>
     </div>
     <button type="submit" className="secondary" disabled={tBusy}><UserPlus size={16}/> Çalışma alanına ekle</button>
    </form>}
    {tState.members.length>0&&<ul className="kv" style={{marginTop:12}}>
     {tState.members.map(m=><li key={m.userId}><span><b>{m.name}</b> ({m.email})</span><b style={{display:'inline-flex',alignItems:'center',gap:8}}>{roleLabel[m.role]||m.role}{(tState.active.role==='owner'||tState.active.role==='admin')&&m.role!=='owner'&&m.userId!==user?.id&&<button type="button" className="danger-button inline" style={{padding:'2px 8px',fontSize:12}} disabled={tBusy} onClick={()=>void runTenantOp({action:'remove_member',userId:m.userId},false)}>Çıkar</button>}</b></li>)}
    </ul>}
   </>}
  </article>

  <article className="panel plan-settings"><span className="settings-icon"><CalendarDays/></span><h2>Ders çalışma programı</h2>{s.plan?(()=>{const p=s.plan!;const st=planStats(p,localToday());const sp=SPORT_PROGRAMS.find(x=>x.id===p.config.sport.programId);return <><span className="status good">{TEMPO_OPTIONS[p.config.tempo].badge}</span><ul className="kv"><li><span>Başlangıç → bitiş</span><b>{shortDate(p.config.startDate)} → {shortDate(st.endDate)}</b></li><li><span>İlerleme</span><b>{st.done}/{st.total} ders · %{st.percent}</b></li><li><span>Okul</span><b>{p.config.school.enabled?`${p.config.school.days.join(', ')} · ${p.config.school.start}-${p.config.school.end}`:'Yok'}</b></li><li><span>Sabit bloklar</span><b>{p.config.fixedBlocks.length?p.config.fixedBlocks.map(b=>b.title).join(', '):'Yok'}</b></li><li><span>Spor</span><b>{sp?.name}{p.config.sport.programId!=='none'?` · ${p.config.sport.start}-${p.config.sport.end}`:''}</b></li><li><span>Alarm</span><b>{p.config.alarm.enabled?p.config.alarm.time:'Kapalı'}{p.config.alarm.blockReminders?' · blok hatırlatıcı':''}</b></li></ul>
   <div className="actions wrap"><button className="primary" onClick={s.openWizard}><Wand2 size={16}/> Programı düzenle</button><button className="secondary" onClick={testAlarm}><BellRing size={16}/> Alarmı dene</button><button className="secondary" onClick={()=>void notif()}><Bell size={16}/> Bildirim izni</button><button className="danger-button inline" onClick={()=>void resetPlan()}><Trash2 size={16}/> Programı sil</button></div><p className="inline-note">Alarm ve hatırlatıcılar uygulama (veya ana ekrana eklenen sayfa) açıkken çalışır.</p></>})():<><p className="description">Okul ve sabit saatlerini, spor programını ve temponu seç; 112 Maarif TYT konusu boş saatlerine çakışmasız yerleşsin.</p><button className="primary" onClick={s.openWizard}><Wand2 size={16}/> Programımı oluştur</button></>}</article>
  <article className="panel"><span className="settings-icon"><Sparkles/></span><h2>Yapay zekâ hakların</h2><span className={'status '+(ai?'good':'pending')}>{!ai?'Sunucuda kapalı':s.usage?.unlimited?'Sınırsız (yönetici)':'Günlük hak'}</span><p className="description">Soru çözümü, ders notu ve aylık rapor yapay zekâ ile hazırlanır. Herkesin adil kullanabilmesi için günlük hak vardır; haklar her gece yarısı (Türkiye saati) yenilenir. Arşive kayıt, tekrar, Excel/PDF ve yedek sınırsızdır.</p>
   {ai&&s.usage&&!s.usage.unlimited&&<ul className="usage-list">{(['solve','note','report','video'] as AiKind[]).map(k=>{const u=s.usage![k];const pct=u.limit?Math.min(100,Math.round(u.used/u.limit*100)):100;return <li key={k}><div><span>{kindLabel[k]}</span><b>{u.used}/{u.limit}</b></div><i className="bar"><b style={{width:pct+'%'}} className={pct>=100?'full':''}/></i></li>})}</ul>}
   {!ai&&<div className="setup-box"><strong>{isDev?'Yukarıdaki Developer panelinden OpenAI API bağla':'Yakında'}</strong><p>{isDev?'Yukarıdaki "OpenAI API & Yapay Zekâ Bağlantısı" panelinden sk-... anahtarını girerek yapay zekâyı hemen aktif edebilirsin.':'Yapay zekâ özellikleri bu sunucuda henüz açılmadı. Soruların arşive kaydedilir; özellik açılınca tek tıkla çözebilirsin.'}</p></div>}
   <p className="description">Soru fotoğrafı ve metni yalnızca çözüm hazırlanırken OpenAI'a gönderilir ve orada saklanmaz.</p></article>
  <article className="panel profile-panel"><span className="settings-icon"><UserRound/></span><h2>Profil</h2><p className="description">Ad, sınıf ve hedefin uygulamanın her yerinde (kenar çubuğu, geri sayım, yazdırma başlığı, yapay zekâ notları) kullanılır.</p>
   <form onSubmit={saveProfile}><div className="profile-head"><span className="avatar">{initials(form.name||'?')}</span><div><strong>{form.name||'Adın'}</strong><small>{form.grade==='Mezun'?'Mezun':form.grade+'. sınıf'} · YKS {form.examYear}</small></div></div>
   <div className="form-grid"><label>Ad Soyad<input required minLength={2} maxLength={60} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label>Sınıf<Choice label="Sınıf" value={form.grade} onChange={v=>{const y=defaultExamYear(v);setForm({...form,grade:v as Profile['grade'],examYear:y,examDate:estimatedExamDate(y)})}} values={['9','10','11','12','Mezun']}/></label><label>Hedef sınav yılı<input type="number" min={2026} max={2035} value={form.examYear} onChange={e=>{const y=Number(e.target.value)||form.examYear;setForm({...form,examYear:y,examDate:form.examDate===estimatedExamDate(form.examYear)?estimatedExamDate(y):form.examDate})}}/></label><label>Sınav tarihi <small>ÖSYM açıklayınca güncelle</small><input type="date" required value={form.examDate} min="2026-01-01" max="2035-12-31" onChange={e=>{if(e.target.value)setForm({...form,examDate:e.target.value})}}/></label><label>Hedef bölüm <small>isteğe bağlı</small><input maxLength={80} placeholder="Örn. Tıp, Bilgisayar Mühendisliği" value={form.target} onChange={e=>setForm({...form,target:e.target.value})}/></label><label>Okul <small>isteğe bağlı</small><input maxLength={80} value={form.school} onChange={e=>setForm({...form,school:e.target.value})}/></label><label>Günlük soru hedefi <small>isteğe bağlı</small><input type="number" min={0} max={500} value={form.dailyGoal||''} placeholder="Örn. 100" onChange={e=>setForm({...form,dailyGoal:Number(e.target.value)||0})}/></label><label>Motto<input maxLength={120} placeholder="Her yanlış, bir sonraki doğruya." value={form.motto} onChange={e=>setForm({...form,motto:e.target.value})}/></label></div>
   <p className="inline-note">{daysUntil(form.examDate)>0?`Sınava ${daysUntil(form.examDate)} gün kaldı.`:'Sınav tarihi geçmiş görünüyor.'} {form.examDate!==estimatedExamDate(form.examYear)&&<button type="button" onClick={()=>setForm({...form,examDate:estimatedExamDate(form.examYear)})}>Tahmini tarihe dön</button>}</p>
   <div className="actions wrap"><button type="submit" className="primary" disabled={saving}>{saving?<LoaderCircle className="spin" size={16}/>:<Check size={16}/>} Profili kaydet</button><button type="button" className="secondary" disabled={saving} onClick={()=>setForm(s.profile)}>Vazgeç</button></div></form></article>
  <article className="panel"><span className="settings-icon"><Sun/></span><h2>Görünüm</h2><p className="description">Açık ya da koyu tema; &ldquo;Cihaz ayarı&rdquo; seçiliyken tarayıcının tercihine uyar.</p><ThemeSwitch/></article>
  <article className="panel"><span className="settings-icon"><Bell/></span><h2>Aylık bildirim</h2><p className="description">Ayın ilk 10 gününde ana sayfada geçen ayın raporu için uyarı gösterilir. Telefonunda bildirim almak için "Aylık raporum" sayfasındaki <b>Takvime ekle</b> düğmesiyle her ayın 1'i 19.00'a tekrarlayan bir takvim hatırlatması indir.</p><div className="setup-box"><strong>Raporun defterinde kalır</strong><p>Konularını, kişisel notlarını ve hedeflerini "Aylık raporum" menüsünden istediğin zaman açabilir, düzenleyebilir ve yazdırabilirsin.</p></div><button className="secondary" onClick={()=>s.setView('report')}>Aylık raporuma git <ArrowUpRight size={16}/></button></article>
  <article className="panel"><span className="settings-icon"><DatabaseBackup/></span><h2>Yedekle ve geri yükle</h2><p className="description">Tüm sorularını, çözümleri, tekrar geçmişini, aylık rapor ve deneme sonuçlarını tek bir JSON dosyası olarak indir. Fotoğraflar yedeğe dahil değildir; çözüm metinleri ve okunan soru metni korunur.</p><div className="actions wrap"><a className="secondary" href="/api/export" download><Download size={16}/> Yedeği indir</a><button className="secondary" disabled={restoring} onClick={()=>fileInput.current?.click()}>{restoring?<LoaderCircle className="spin" size={16}/>:<Upload size={16}/>} Geri yükle</button><input ref={fileInput} type="file" accept="application/json,.json" className="sr-only" aria-label="Yedek dosyası" onChange={e=>void restore(e.target.files?.[0])}/></div><p className="inline-note">Geri yüklemede aynı kimlikli kayıtlar atlanır; mevcut verin silinmez.</p></article>
  <article className="panel"><span className="settings-icon"><Download/></span><h2>Arşiv ve çıktı</h2><p className="description">"Yanlış arşivim" sayfasında filtreleri uygulayıp <b>Excel (.xlsx)</b> ile gerçek Excel dosyası (soru listesi + konu özeti sayfaları) al. "Yazdır / PDF" ile soruları, fotoğrafları, çözümleri ve notları A4 düzeninde yazdır veya PDF olarak kaydet.</p><button className="secondary" onClick={()=>s.setView('archive')}>Yanlış arşivime git <ArrowUpRight size={16}/></button></article>
  <article className="panel account-panel"><span className="settings-icon"><ShieldCheck/></span><h2>Hesap ve güvenlik</h2><p className="description">Giriş yapan hesap: <b>{user?.email}</b>{isDev?<span className="tag">Developer</span>:null}{user?.google?<span className="tag">Google bağlı</span>:null} <span className="tag">{user?.authProvider==='supabase'?'Supabase Auth':'Yerel Auth'}</span>. Aktif çalışma alanı: <b>{tState?.active?.name||user?.tenantName||'Kişisel Çalışma Alanı'}</b>.</p>
   {user?.email!=='netududev@gmail.com'&&<form onSubmit={changePassword} className="pw-form"><h3><KeyRound size={16}/> {user?.hasPassword?'Şifreyi değiştir':'Şifre oluştur'}</h3>{!user?.hasPassword&&<p className="muted">Google ile giriş yaptın; istersen e-posta ve şifreyle de girebilmek için bir şifre oluştur.</p>}<div className="form-grid">{user?.hasPassword&&<label>Mevcut şifre<input type="password" autoComplete="current-password" required value={pw.current} onChange={e=>setPw({...pw,current:e.target.value})}/></label>}<label>Yeni şifre<input type="password" autoComplete="new-password" required minLength={8} placeholder="En az 8 karakter, harf ve rakam" value={pw.next} onChange={e=>setPw({...pw,next:e.target.value})}/></label></div><button type="submit" className="secondary" disabled={pwBusy}>{pwBusy?<LoaderCircle className="spin" size={16}/>:<Check size={16}/>} Kaydet</button></form>}
   <div className="actions wrap account-actions"><button className="secondary" onClick={()=>void s.logout()}><LogOut size={16}/> Çıkış yap</button>{!isDev&&<button className="danger-button inline" onClick={()=>setDel(true)}><Trash2 size={16}/> Hesabımı sil</button>}</div></article>
  <AlertDialog open={del} onOpenChange={v=>{if(!delBusy){setDel(v);setDelForm({confirm:'',password:''})}}}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Hesabın kalıcı olarak silinsin mi?</AlertDialogTitle><AlertDialogDescription>Tüm soruların, fotoğrafların, çözümlerin, notların, raporların ve deneme sonuçların silinir. Bu işlem geri alınamaz. İstersen önce "Yedeği indir" ile yedek al.</AlertDialogDescription></AlertDialogHeader>
   <div className="form-grid single">{user?.hasPassword&&<label>Şifren<input type="password" autoComplete="current-password" value={delForm.password} onChange={e=>setDelForm({...delForm,password:e.target.value})}/></label>}<label>Onaylamak için <b>SİL</b> yaz<input value={delForm.confirm} onChange={e=>setDelForm({...delForm,confirm:e.target.value})} placeholder="SİL"/></label></div>
   <AlertDialogFooter><AlertDialogCancel disabled={delBusy}>Vazgeç</AlertDialogCancel><button className="primary danger" disabled={delBusy||delForm.confirm!=='SİL'} onClick={()=>void deleteAccount()}>{delBusy?<LoaderCircle className="spin" size={16}/>:<Trash2 size={16}/>} Kalıcı olarak sil</button></AlertDialogFooter></AlertDialogContent></AlertDialog>
 </div>}
