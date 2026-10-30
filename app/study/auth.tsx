"use client";
import {useEffect,useState} from 'react';
import {LogIn,UserPlus,Eye,EyeOff,LoaderCircle,Sparkles,RotateCcw,ChartNoAxesCombined,ShieldCheck,Check,CalendarDays,Gauge,AlarmClock,Building2,Terminal,KeyRound,Mail,ArrowLeft} from 'lucide-react';
import {toast} from 'sonner';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {defaultExamYear,estimatedExamDate,type Profile} from '@/lib/study';
import {postJson,Choice,readSetting,writeSetting} from './shared';
import {Logo} from './logo';

const DEV_EMAIL='netududev@gmail.com';
const DEV_EMAILS=['netududev@gmail.com','yusufykykaya@gmail.com','batur2864@hotmail.com'];
const authErrors:Record<string,string>={google_off:'Google ile giriş bu sunucuda henüz açılmadı.',google_cancel:'Google girişi iptal edildi.',google_state:'Google girişi zaman aşımına uğradı; tekrar dene.',google_token:'Google girişi doğrulanamadı; tekrar dene.',google_profile:'Google hesap bilgileri alınamadı.',google_email:'Google hesabının e-postası doğrulanmamış.',google_error:'Google girişi tamamlanamadı; tekrar dene.',closed:'Yeni kayıtlar şu anda kapalı.'};
const grades=['9','10','11','12','Mezun'];
const gradeLabel=(g:string)=>g==='Mezun'?'Mezun':g+'. sınıf';

function GoogleIcon(){return <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.2-.1-2.3-.4-3.5z"/></svg>}

// Giriş yapılmamışken gösterilen tanıtım + Supabase Auth / Multi-Tenant / Developer giriş ekranı
export function AuthScreen({onDone,onBack,initialMode='login'}:{onDone:()=>void;onBack?:()=>void;initialMode?:'login'|'register'}){
 const [mode,setMode]=useState<'login'|'register'|'forgot'>(initialMode),[busy,setBusy]=useState(false),[show,setShow]=useState(false),[google,setGoogle]=useState(false),[open,setOpen]=useState(true),[authProvider,setAuthProvider]=useState<'supabase'|'local'>('local'),[error,setError]=useState('');
 const [f,setF]=useState({name:'',email:'',password:'',grade:'12',tenantName:'',accept:false,remember:true});
 const [resetStep,setResetStep]=useState<'email'|'code'>('email'),[resetCode,setResetCode]=useState(''),[resetPassword,setResetPassword]=useState(''),[resetInfo,setResetInfo]=useState<{message:string;previewCode?:string}|null>(null);
 const cleanEmail=f.email.trim().toLowerCase();
 const isDevEmail=mode==='login'&&cleanEmail===DEV_EMAIL;
 const isAnyDevEmail=DEV_EMAILS.includes(cleanEmail);
 useEffect(()=>{
  const savedEmail=readSetting('remembered-email','');
  const savedRemember=readSetting('remember-me','1')!=='0';
  if(savedEmail||!savedRemember){
   setF(prev=>({...prev,email:savedEmail||prev.email,remember:savedRemember}));
  }
  fetch('/api/auth/me').then(r=>r.json() as Promise<{googleReady?:boolean;registrationOpen?:boolean;authProvider?:'supabase'|'local'}>).then(d=>{
   setGoogle(!!d.googleReady);
   setOpen(d.registrationOpen!==false);
   if(d.authProvider)setAuthProvider(d.authProvider);
  }).catch(()=>{});
  if(location.hash&&location.hash.includes('access_token=')){
   const hp=new URLSearchParams(location.hash.replace(/^#/,''));
   const accessToken=hp.get('access_token')||'';
   const refreshToken=hp.get('refresh_token')||'';
   if(accessToken){
    history.replaceState(null,'','/');
    setBusy(true);
    postJson('/api/auth/me',{accessToken,refreshToken}).then(()=>{
     toast.success('Supabase Google hesabınla giriş yapıldı!');
     onDone();
    }).catch(err=>{
     setError((err as Error).message||'Supabase OAuth oturumu açılamadı.');
    }).finally(()=>setBusy(false));
   }
  }
  const q=new URLSearchParams(location.search);
  const e=q.get('auth_error');
  if(e){setError(authErrors[e]||'Giriş tamamlanamadı.');history.replaceState(null,'','/')}
  if(q.get('kayit')!==null)setMode('register');
 },[onDone]);
 async function loginAsDeveloper(){
  setError('');setBusy(true);
  try{
   const d=await postJson('/api/auth/login',{email:DEV_EMAIL,password:'',remember:f.remember}) as unknown as {sessionToken?:string};
   if(f.remember){
    writeSetting('remember-me','1');
    writeSetting('remembered-email',DEV_EMAIL);
    if(d.sessionToken)writeSetting('session-token',d.sessionToken);
   }else{
    writeSetting('remember-me','0');
    writeSetting('remembered-email','');
    writeSetting('session-token','');
   }
   toast.success('netudu Geliştirici (Developer) hesabıyla giriş yapıldı! Ayarlar bölümünden OpenAI ve Supabase API bağlantılarını yönetebilirsin.');
   onDone();
  }catch(err){
   setError((err as Error).message);
  }finally{
   setBusy(false);
  }
 }
 async function submit(e:React.FormEvent){
  e.preventDefault();setError('');setBusy(true);
  try{
   if(mode==='forgot'){
    if(resetStep==='email'){
     const r=await fetch('/api/auth/forgot-password',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'request',email:f.email})
     });
     const d=await r.json() as {ok?:boolean;message?:string;previewCode?:string;error?:string};
     if(!r.ok)throw new Error(d.error||'Doğrulama kodu gönderilemedi.');
     setResetInfo({message:d.message||'Doğrulama kodu gönderildi.',previewCode:d.previewCode});
     setResetStep('code');
     toast.success(d.message||'Şifre sıfırlama kodu gönderildi!');
     return;
    }
    const r=await fetch('/api/auth/forgot-password',{
     method:'POST',
     headers:{'Content-Type':'application/json'},
     body:JSON.stringify({action:'verify',email:f.email,code:resetCode,password:resetPassword})
    });
    const d=await r.json() as {ok?:boolean;message?:string;error?:string};
    if(!r.ok)throw new Error(d.error||'Şifre sıfırlanamadı.');
    toast.success(d.message||'Şifren başarıyla sıfırlandı ve giriş yapıldı!');
    onDone();
    return;
   }
   if(mode==='login'){
    const d=await postJson('/api/auth/login',{email:f.email,password:isDevEmail?'':f.password,remember:f.remember}) as unknown as {sessionToken?:string};
    if(f.remember){
     writeSetting('remember-me','1');
     writeSetting('remembered-email',cleanEmail);
     if(d.sessionToken)writeSetting('session-token',d.sessionToken);
    }else{
     writeSetting('remember-me','0');
     writeSetting('remembered-email','');
     writeSetting('session-token','');
    }
    if(isAnyDevEmail){
     toast.success('Geliştirici (Developer) modu aktif! Ayarlar bölümünden kullanıcıları, OpenAI ve Supabase bağlantılarını yönetebilirsin.');
    }
   }else{
    const d=await postJson('/api/auth/register',{
     name:f.name,
     email:f.email,
     password:f.password,
     grade:f.grade,
     tenantName:f.tenantName,
     accept:f.accept,
     remember:f.remember
    }) as unknown as {claimed?:boolean;sessionToken?:string};
    const y=defaultExamYear(f.grade);
    const initialProf:Profile={name:f.name.trim(),grade:f.grade as Profile['grade'],target:'',examYear:y,examDate:estimatedExamDate(y),motto:'',dailyGoal:0,school:''};
    writeSetting('profile:'+cleanEmail,JSON.stringify(initialProf));
    if(f.remember){
     writeSetting('remember-me','1');
     writeSetting('remembered-email',cleanEmail);
     if(d.sessionToken)writeSetting('session-token',d.sessionToken);
    }else{
     writeSetting('remember-me','0');
     writeSetting('remembered-email','');
     writeSetting('session-token','');
    }
    toast.success(isAnyDevEmail?'Geliştirici (Developer) hesabın oluşturuldu! Hoş geldin.':d.claimed?'Hesabın ve çalışma alanın oluşturuldu; önceki defterin bu hesaba bağlandı.':'Hesabın ve çalışma alanın (Tenant) oluşturuldu. Hoş geldin!');
   }
   onDone();
  }catch(err){setError((err as Error).message)}finally{setBusy(false)}
 }
 const year=defaultExamYear(f.grade);
 return <div className="auth-shell"><header className="auth-top"><Logo size={28}/>{onBack&&<button type="button" className="text-button" onClick={onBack}><ArrowLeft size={16}/> Ana sayfa</button>}</header><div className="auth-page">
  <section className="auth-hero"><p className="eyebrow">NETUDU · YKS DERS ÇALIŞMA PROGRAMI</p><h1>Programın hazır, yanlışların kayıt altında.</h1><p className="auth-lead">Okul, dershane ve spor saatlerine göre her gün ne çalışacağını otomatik planla. Maarif TYT konularını seçtiğin tempoda bitir; denemedeki yanlışlarını fotoğrafla yükle, çözümünü al ve aralıklı tekrarla kalıcı öğren.</p>
   <ul className="auth-features"><li><CalendarDays size={18}/><div><b>Kişisel haftalık program</b><span>Okul, sabit dersler ve sporla çakışmadan, saat saat.</span></div></li><li><Gauge size={18}/><div><b>Maarif TYT kampı</b><span>112 konu · Rahat 22, Dengeli 16, Yoğun 12 hafta.</span></div></li><li><AlarmClock size={18}/><div><b>Alarm ve domino kaydırma</b><span>Ders saatinde hatırlatır; çalışamadığın gün program kayar.</span></div></li><li><Sparkles size={18}/><div><b>Fotoğraftan çözüm</b><span>Yanlışın adım adım çözülür, konusu ve videosu bulunur.</span></div></li><li><RotateCcw size={18}/><div><b>Aralıklı tekrar</b><span>1 → 3 → 7 → 14 → 30 → 60 gün takvimi.</span></div></li><li><ChartNoAxesCombined size={18}/><div><b>Aylık rapor ve netler</b><span>En çok zorlandığın konular, hedefler, grafikler.</span></div></li></ul></section>
  <section className="auth-card" aria-label="Giriş">
   <div className="segmented full auth-tabs" role="tablist"><button role="tab" aria-selected={mode==='login'} className={mode==='login'?'on':''} onClick={()=>{setMode('login');setError('')}}><LogIn size={15}/> Giriş yap</button><button role="tab" aria-selected={mode==='register'} className={mode==='register'?'on':''} onClick={()=>{setMode('register');setError('')}} disabled={!open}><UserPlus size={15}/> Kayıt ol</button><button role="tab" aria-selected={mode==='forgot'} className={mode==='forgot'?'on':''} onClick={()=>{setMode('forgot');setResetStep('email');setResetInfo(null);setError('')}}><KeyRound size={15}/> Şifremi unuttum</button></div>
   <h2>{mode==='forgot'?'Şifreni sıfırla.':mode==='login'?'Tekrar hoş geldin.':'Ücretsiz programını oluştur.'}</h2><p className="muted">{mode==='forgot'?(resetStep==='email'?'Hesabına kayıtlı e-posta adresini gir; sana 6 haneli doğrulama kodu gönderelim.':'E-postana gönderilen 6 haneli kodu ve yeni şifreni gir.'):mode==='login'?'Programına kaldığın yerden devam et.':'Bir dakikada hazır. Kredi kartı gerekmez.'}</p>
   {mode!=='forgot'&&google&&<><a className="google-button" href="/api/auth/google"><GoogleIcon/> Google ile devam et</a><div className="auth-or"><span>veya e-posta ile</span></div></>}
   <form onSubmit={submit} className="auth-form">
    {mode==='register'&&<label className="field-label">Ad Soyad<input required minLength={2} maxLength={60} autoComplete="name" value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder="Örn. Elif Yılmaz"/></label>}
    <label className="field-label">E-posta<input required type="email" autoComplete="email" inputMode="email" maxLength={200} value={f.email} onChange={e=>setF({...f,email:e.target.value})} disabled={mode==='forgot'&&resetStep==='code'} placeholder="ornek@eposta.com"/></label>
    {mode!=='forgot'&&isAnyDevEmail&&!isDevEmail&&(
     <div className="setup-box" style={{margin:'4px 0',padding:'10px 14px'}}>
      <strong><Terminal size={14} style={{display:'inline',verticalAlign:'middle',marginRight:6}}/>Yetkili Geliştirici (Developer) Hesabı</strong>
      <p style={{marginTop:4,fontSize:13}}><code>{cleanEmail}</code> hesabı tam <b>Developer Modu</b> yetkisine sahiptir (kayıtlı tüm kullanıcıları görme, OpenAI API ve Supabase yönetimi).</p>
     </div>
    )}
    {mode==='forgot'?(
     resetStep==='code'&&<>
      {resetInfo&&<div className="verify good" role="status"><Mail size={18}/><div><b>Kod Gönderildi:</b> {resetInfo.message}{resetInfo.previewCode&&<div style={{marginTop:8,padding:'8px 10px',background:'#1b1f23',borderRadius:8,border:'1px solid #2fb597',display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}><span>Doğrulama Kodun: <b style={{fontSize:16,letterSpacing:3,color:'#5fd0b6'}}>{resetInfo.previewCode}</b></span><button type="button" className="secondary" style={{minHeight:30,padding:'4px 10px',fontSize:12}} onClick={()=>setResetCode(resetInfo.previewCode!)}>Kodu Doldur</button></div>}</div></div>}
      <label className="field-label">6 Haneli Doğrulama Kodu<input required inputMode="numeric" maxLength={8} value={resetCode} onChange={e=>setResetCode(e.target.value)} placeholder="Örn. 123456" style={{letterSpacing:4,fontWeight:700,fontSize:18}}/></label>
      <label className="field-label">Yeni Şifre<span className="pw-field"><input required type={show?'text':'password'} autoComplete="new-password" minLength={8} maxLength={200} value={resetPassword} onChange={e=>setResetPassword(e.target.value)} placeholder="En az 8 karakter, harf ve rakam"/><button type="button" className="icon-button" aria-label={show?'Şifreyi gizle':'Şifreyi göster'} onClick={()=>setShow(!show)}>{show?<EyeOff size={17}/>:<Eye size={17}/>}</button></span></label>
     </>
    ):isDevEmail?(
     <div className="setup-box" style={{margin:'4px 0',padding:'10px 14px'}}>
      <strong><Terminal size={14} style={{display:'inline',verticalAlign:'middle',marginRight:6}}/>Geliştirici (Developer) Hesabı Algılandı</strong>
      <p style={{marginTop:4,fontSize:13}}><code>{DEV_EMAIL}</code> için şifre gerekmez. Doğrudan giriş yaparak OpenAI ve Supabase API bağlantılarını yönetebilirsin.</p>
     </div>
    ):(
     <div>
      <label className="field-label">Şifre<span className="pw-field"><input required type={show?'text':'password'} autoComplete={mode==='login'?'current-password':'new-password'} minLength={mode==='register'?8:1} maxLength={200} value={f.password} onChange={e=>setF({...f,password:e.target.value})} placeholder={mode==='register'?'En az 8 karakter, harf ve rakam':'Şifren'}/><button type="button" className="icon-button" aria-label={show?'Şifreyi gizle':'Şifreyi göster'} onClick={()=>setShow(!show)}>{show?<EyeOff size={17}/>:<Eye size={17}/>}</button></span></label>
      {mode==='login'&&<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:8,gap:8}}><label className="check-line" style={{margin:0}}><input type="checkbox" checked={f.remember} onChange={e=>setF({...f,remember:e.target.checked})}/><span>Beni hatırla</span></label><button type="button" className="text-button" style={{fontSize:13}} onClick={()=>{setMode('forgot');setResetStep('email');setResetInfo(null);setError('')}}><KeyRound size={14}/> Şifremi unuttum</button></div>}
     </div>
    )}
    {mode==='register'&&<>
     <label className="field-label">Sınıfın<Choice label="Sınıf" value={f.grade} onChange={v=>setF({...f,grade:v})} values={grades}/><small className="hint">Hedef sınavın: YKS {year} (tahmini {new Date(estimatedExamDate(year)+'T12:00:00').toLocaleDateString('tr-TR',{day:'numeric',month:'long'})}). Sonra değiştirebilirsin.</small></label>
     <label className="field-label"><span style={{display:'inline-flex',alignItems:'center',gap:5}}><Building2 size={14}/> Çalışma Alanı / Kurum (Tenant) Adı <small className="muted">(isteğe bağlı)</small></span><input maxLength={80} value={f.tenantName} onChange={e=>setF({...f,tenantName:e.target.value})} placeholder={f.name?`${f.name} Çalışma Alanı`:'Örn. Kişisel Defterim veya Fen Lisesi Kampı'}/></label>
     <label className="check-line"><input type="checkbox" checked={f.remember} onChange={e=>setF({...f,remember:e.target.checked})}/><span>Beni hatırla (oturumumu ve sınıf/profil bilgilerimi bu cihazda açık tut)</span></label>
     <label className="check-line"><input type="checkbox" checked={f.accept} onChange={e=>setF({...f,accept:e.target.checked})} required/><span>Sorularımın ve fotoğraflarımın çözüm üretmek için yapay zekâ hizmetine (OpenAI) gönderileceğini ve <a href="#gizlilik" onClick={e=>{e.preventDefault();toast.message('Gizlilik',{description:'Verilerin yalnızca senin hesabına ve çalışma alanına (Tenant) bağlıdır, kimseyle paylaşılmaz ve reklam için kullanılmaz. Fotoğraflar yalnızca çözüm hazırlanırken OpenAI\'a gönderilir ve orada saklanmaz. Hesabını Ayarlar\'dan istediğin zaman tüm verileriyle silebilirsin.'})}}>gizlilik ilkelerini</a> kabul ediyorum.</span></label>
    </>}
    {error&&<div className="error-banner" role="alert">{error}</div>}
    <button type="submit" className="primary full" disabled={busy}>{busy?<LoaderCircle className="spin" size={18}/>:mode==='forgot'?(resetStep==='email'?<Mail size={18}/>:<Check size={18}/>):isDevEmail?<Terminal size={18}/>:mode==='login'?<LogIn size={18}/>:<UserPlus size={18}/>} {mode==='forgot'?(resetStep==='email'?'E-postama Doğrulama Kodu Gönder':'Şifremi Sıfırla ve Giriş Yap'):isDevEmail?'Geliştirici Olarak Giriş Yap (Şifresiz)':mode==='login'?'Giriş yap':'Hesabımı oluştur'}</button>
    {mode==='forgot'&&resetStep==='code'&&<button type="button" className="secondary full" disabled={busy} onClick={()=>{setResetStep('email');setError('')}}><ArrowLeft size={16}/> E-posta adresini değiştir / Yeni kod gönder</button>}
    {mode==='login'&&!isDevEmail&&<button type="button" className="secondary full" disabled={busy} onClick={()=>void loginAsDeveloper()}><Terminal size={16}/> Developer Girişi ({DEV_EMAIL} · Şifresiz)</button>}
   </form>
   {mode==='login'?<p className="auth-switch">Hesabın yok mu? <button onClick={()=>{setMode('register');setError('')}} disabled={!open}>Kayıt ol</button> · <button onClick={()=>{setMode('forgot');setResetStep('email');setResetInfo(null);setError('')}}>Şifremi unuttum</button></p>:<p className="auth-switch">Şifreni hatırladın mı? <button onClick={()=>{setMode('login');setError('')}}>Giriş yap</button></p>}
   <p className="auth-safe"><ShieldCheck size={15}/> {authProvider==='supabase'?'Supabase Auth & Multi-Tenant (RLS) koruması aktif.':'Şifren şifrelenmiş olarak saklanır; çalışma alanını yalnızca sen görürsün.'}</p>
  </section>
 </div></div>}

// Google ile ilk girişte (veya profili hiç kaydedilmemişse) kısa kurulum
export function Onboarding({open,profile,onSave}:{open:boolean;profile:Profile;onSave:(p:Profile)=>void}){
 const [f,setF]=useState<Profile>(profile);const [busy,setBusy]=useState(false);
 useEffect(()=>{if(open)setF(profile)},[open,profile]);
 function setGrade(g:string){const y=defaultExamYear(g);setF(p=>({...p,grade:g as Profile['grade'],examYear:y,examDate:estimatedExamDate(y)}))}
 async function save(e:React.FormEvent){e.preventDefault();setBusy(true);try{const d=await postJson('/api/profile',{...f,dailyGoal:Number(f.dailyGoal)||0},'PUT');const email=readSetting('remembered-email','');if(email&&d.profile)writeSetting('profile:'+email,JSON.stringify(d.profile));onSave(d.profile);toast.success('Defterin hazır. İlk yanlışını ekleyerek başla!')}catch(err){toast.error((err as Error).message)}finally{setBusy(false)}}
 return <Dialog open={open} onOpenChange={()=>{}}><DialogContent className="upload-dialog onboarding" showCloseButton={false}><DialogHeader><DialogTitle>netudu defterini kişiselleştirelim</DialogTitle><DialogDescription>Bu bilgiler geri sayım, konu menüsünde sınıfının öne alınması ve yapay zekâ notları için kullanılır.</DialogDescription></DialogHeader>
  <form onSubmit={save}><div className="form-grid"><label>Ad Soyad<input required minLength={2} maxLength={60} value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></label><label>Sınıf<Choice label="Sınıf" value={f.grade} onChange={setGrade} values={grades}/></label><label>Hedef YKS yılı<input type="number" min={2026} max={2035} value={f.examYear} onChange={e=>{const y=Number(e.target.value)||f.examYear;setF({...f,examYear:y,examDate:estimatedExamDate(y)})}}/></label><label>Hedef bölüm <small>isteğe bağlı</small><input maxLength={80} placeholder="Örn. Tıp" value={f.target} onChange={e=>setF({...f,target:e.target.value})}/></label></div>
  <p className="inline-note">Sınav tarihi tahmini olarak {new Date(f.examDate+'T12:00:00').toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'})} alındı; ÖSYM açıklayınca Ayarlar'dan güncelleyebilirsin. ({gradeLabel(f.grade)})</p>
  <button type="submit" className="primary full" disabled={busy}>{busy?<LoaderCircle className="spin" size={18}/>:<Check size={18}/>} Başla</button></form></DialogContent></Dialog>}
