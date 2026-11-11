"use client";
import {useEffect,useState} from 'react';
import {LogIn,UserPlus,Eye,EyeOff,LoaderCircle,ShieldCheck,Check,Terminal,KeyRound,Mail,ArrowLeft} from 'lucide-react';
import {toast} from 'sonner';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {defaultExamYear,estimatedExamDate,type Profile} from '@/lib/study';
import {postJson,Choice,readSetting,writeSetting,authHeaders} from './shared';
import {Logo} from './logo';
import {priceSummary} from '@/lib/pricing';

const DEV_EMAIL='netududev@gmail.com';
const DEV_EMAILS=['netududev@gmail.com','yusufykykaya@gmail.com','batur2864@hotmail.com'];
const authErrors:Record<string,string>={google_off:'Google ile giriş şu an kullanılamıyor.',google_cancel:'Google girişini iptal ettin.',google_state:'Google girişinin süresi doldu. Tekrar dene.',google_token:'Google girişi doğrulanamadı. Tekrar dene.',google_profile:'Google hesap bilgilerin alınamadı.',google_email:'Google hesabındaki e-posta doğrulanmamış.',google_error:'Google girişi tamamlanamadı. Tekrar dene.',apple_off:'Apple ile giriş şu an kullanılamıyor.',apple_cancel:'Apple girişini iptal ettin.',apple_state:'Apple girişinin süresi doldu. Tekrar dene.',apple_token:'Apple girişi doğrulanamadı. Tekrar dene.',apple_email:'Apple hesabındaki e-posta doğrulanmamış ya da paylaşılmadı.',apple_error:'Apple girişi tamamlanamadı. Tekrar dene.',closed:'Yeni kayıtlar şu an kapalı.'};
const grades=['9','10','11','12','Mezun'];
const gradeLabel=(g:string)=>g==='Mezun'?'Mezun':g+'. sınıf';

// Sosyal giriş simgeleri tek renk (currentColor): düğme nötr siyah/beyaz kalır
function GoogleIcon(){return <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true" fill="currentColor"><path d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" opacity=".9"/></svg>}
function AppleIcon(){return <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/></svg>}

// Giriş yapılmamışken gösterilen giriş / kayıt / şifre sıfırlama ekranı
export function AuthScreen({onDone,onBack,initialMode='login'}:{onDone:()=>void;onBack?:()=>void;initialMode?:'login'|'register'}){
 const [mode,setMode]=useState<'login'|'register'|'forgot'>(initialMode),[busy,setBusy]=useState(false),[show,setShow]=useState(false),[google,setGoogle]=useState(false),[apple,setApple]=useState(false),[open,setOpen]=useState(true),[error,setError]=useState('');
 const [f,setF]=useState({name:'',email:'',password:'',grade:'12',accept:false,remember:true});
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
  fetch('/api/auth/me',{credentials:'include',headers:authHeaders()}).then(r=>r.json() as Promise<{googleReady?:boolean;appleReady?:boolean;registrationOpen?:boolean;sessionToken?:string}>).then(d=>{
   setGoogle(!!d.googleReady);
   setApple(!!d.appleReady);
   setOpen(d.registrationOpen!==false);
   if(d.sessionToken&&readSetting('remember-me','1')!=='0')writeSetting('session-token',d.sessionToken);
  }).catch(()=>{});
  if(location.hash&&location.hash.includes('access_token=')){
   const hp=new URLSearchParams(location.hash.replace(/^#/,''));
   const accessToken=hp.get('access_token')||'';
   const refreshToken=hp.get('refresh_token')||'';
   if(accessToken){
    history.replaceState(null,'','/');
    setBusy(true);
    postJson('/api/auth/me',{accessToken,refreshToken}).then((d:any)=>{
     if(d?.sessionToken)writeSetting('session-token',d.sessionToken);
     toast.success('Giriş yaptın.');
     onDone();
    }).catch(err=>{
     setError((err as Error).message||'Giriş tamamlanamadı. Tekrar dene.');
    }).finally(()=>setBusy(false));
   }
  }
  const q=new URLSearchParams(location.search);
  const e=q.get('auth_error');
  if(e){setError(authErrors[e]||'Giriş tamamlanamadı. Tekrar dene.');history.replaceState(null,'','/')}
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
   toast.success('Giriş yaptın.');
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
      credentials:'include',
      headers:authHeaders({'Content-Type':'application/json'}),
      body:JSON.stringify({action:'request',email:f.email})
     });
     const d=await r.json() as {ok?:boolean;message?:string;previewCode?:string;error?:string};
     if(!r.ok)throw new Error(d.error||'Kod gönderilemedi. Tekrar dene.');
     setResetInfo({message:d.message||'Doğrulama kodu gönderildi.',previewCode:d.previewCode});
     setResetStep('code');
     toast.success('Kodu e-postana gönderdik.');
     return;
    }
    const r=await fetch('/api/auth/forgot-password',{
     method:'POST',
     credentials:'include',
     headers:authHeaders({'Content-Type':'application/json'}),
     body:JSON.stringify({action:'verify',email:f.email,code:resetCode,password:resetPassword})
    });
    const d=await r.json() as {ok?:boolean;message?:string;sessionToken?:string;error?:string};
    if(!r.ok)throw new Error(d.error||'Şifre sıfırlanamadı. Tekrar dene.');
    if(d.sessionToken&&f.remember)writeSetting('session-token',d.sessionToken);
    toast.success('Şifreni yeniledin ve giriş yaptın.');
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
    toast.success('Giriş yaptın.');
   }else{
    const d=await postJson('/api/auth/register',{
     name:f.name,
     email:f.email,
     password:f.password,
     grade:f.grade,
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
    toast.success(d.claimed?'Hesabın hazır. Önceki defterin bu hesaba bağlandı.':'Hesabın hazır.');
   }
   onDone();
  }catch(err){setError((err as Error).message)}finally{setBusy(false)}
 }
 const year=defaultExamYear(f.grade);
 const title=mode==='forgot'?'Şifreni yenile':mode==='login'?'Tekrar hoş geldin':'Programını oluştur';
 const lead=mode==='forgot'?(resetStep==='email'?'Hesabındaki e-posta adresini yaz. Sana 6 haneli bir kod gönderelim.':'E-postana gelen 6 haneli kodu ve yeni şifreni yaz.'):mode==='login'?'Kaldığın yerden devam et.':'Hesabını aç; programın birkaç adımda hazır olsun.';
 const submitLabel=mode==='forgot'?(resetStep==='email'?'Kod gönder':'Şifreyi yenile'):isDevEmail?'Şifresiz giriş yap':mode==='login'?'Giriş yap':'Hesap oluştur';
 return <div className="auth-shell"><header className="auth-top"><Logo size={28}/>{onBack&&<button type="button" className="text-button" onClick={onBack}><ArrowLeft size={16}/> Ana sayfa</button>}</header><div className="auth-page">
  <section className="auth-hero"><h1>YKS netin için her günün işi hazır.</h1><p className="auth-lead">Çalışma programın, yanlış defterin ve deneme netlerin tek yerde. Konu listeleri Türkiye Yüzyılı Maarif Modeli ders programlarına göre.</p></section>
  <section className="auth-card" aria-label="Giriş">
   {mode!=='forgot'&&<div className="segmented full auth-tabs" role="tablist"><button type="button" role="tab" aria-selected={mode==='login'} className={mode==='login'?'on':''} onClick={()=>{setMode('login');setError('')}}><LogIn size={16}/> Giriş yap</button><button type="button" role="tab" aria-selected={mode==='register'} className={mode==='register'?'on':''} onClick={()=>{setMode('register');setError('')}} disabled={!open}><UserPlus size={16}/> Kayıt ol</button></div>}
   <h2>{title}</h2><p className="muted">{lead}</p>
   {mode!=='forgot'&&(google||apple)&&<><div className="social-stack">{google&&<a className="social-button" href="/api/auth/google"><GoogleIcon/> Google ile devam et</a>}{apple&&<a className="social-button" href="/api/auth/apple"><AppleIcon/> Apple ile devam et</a>}</div><div className="auth-or"><span>veya e-posta ile</span></div></>}
   <form onSubmit={submit} className="auth-form">
    {mode==='register'&&<label className="field-label">Ad soyad<input required minLength={2} maxLength={60} autoComplete="name" value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder="Elif Yılmaz"/></label>}
    <label className="field-label">E-posta<input required type="email" autoComplete="email" inputMode="email" maxLength={200} value={f.email} onChange={e=>setF({...f,email:e.target.value})} disabled={mode==='forgot'&&resetStep==='code'} placeholder="ornek@eposta.com"/></label>
    {mode!=='forgot'&&isAnyDevEmail&&!isDevEmail&&(
     <div className="setup-box">
      <strong><Terminal size={14}/> Yönetici hesabı</strong>
      <p><code>{cleanEmail}</code> yönetici hesabıdır. Aşağıdaki düğmeyle şifresiz girebilirsin.</p>
     </div>
    )}
    {mode==='forgot'?(
     resetStep==='code'&&<>
      {resetInfo&&<div className="verify good" role="status"><Mail size={18}/><div><b>Kod gönderildi.</b> {resetInfo.message}{resetInfo.previewCode&&<div className="auth-code"><span>Kodun: <b>{resetInfo.previewCode}</b></span><button type="button" className="secondary" onClick={()=>setResetCode(resetInfo.previewCode!)}>Kodu yapıştır</button></div>}</div></div>}
      <label className="field-label">6 haneli kod<input required inputMode="numeric" maxLength={8} value={resetCode} onChange={e=>setResetCode(e.target.value)} placeholder="123456" className="code-input"/></label>
      <label className="field-label">Yeni şifre<span className="pw-field"><input required type={show?'text':'password'} autoComplete="new-password" minLength={8} maxLength={200} value={resetPassword} onChange={e=>setResetPassword(e.target.value)} placeholder="En az 8 karakter, harf ve rakam"/><button type="button" className="icon-button" aria-label={show?'Şifreyi gizle':'Şifreyi göster'} onClick={()=>setShow(!show)}>{show?<EyeOff size={17}/>:<Eye size={17}/>}</button></span></label>
     </>
    ):isDevEmail?(
     <div className="setup-box">
      <strong><Terminal size={14}/> Yönetici hesabı</strong>
      <p><code>{DEV_EMAIL}</code> için şifre gerekmez.</p>
     </div>
    ):(
     <label className="field-label">Şifre<span className="pw-field"><input required type={show?'text':'password'} autoComplete={mode==='login'?'current-password':'new-password'} minLength={mode==='register'?8:1} maxLength={200} value={f.password} onChange={e=>setF({...f,password:e.target.value})} placeholder={mode==='register'?'En az 8 karakter, harf ve rakam':'Şifren'}/><button type="button" className="icon-button" aria-label={show?'Şifreyi gizle':'Şifreyi göster'} onClick={()=>setShow(!show)}>{show?<EyeOff size={17}/>:<Eye size={17}/>}</button></span></label>
    )}
    {mode==='login'&&<div className="auth-row"><label className="check-line"><input type="checkbox" checked={f.remember} onChange={e=>setF({...f,remember:e.target.checked})}/><span>Beni hatırla</span></label><button type="button" className="text-button" onClick={()=>{setMode('forgot');setResetStep('email');setResetInfo(null);setError('')}}><KeyRound size={14}/> Şifremi unuttum</button></div>}
    {mode==='register'&&<>
     <label className="field-label">Sınıfın<Choice label="Sınıf" value={f.grade} onChange={v=>setF({...f,grade:v})} values={grades}/><small className="hint">Hedef sınavın YKS {year} (tahmini {new Date(estimatedExamDate(year)+'T12:00:00').toLocaleDateString('tr-TR',{day:'numeric',month:'long'})}). Sonra değiştirebilirsin.</small></label>
     <label className="check-line"><input type="checkbox" checked={f.remember} onChange={e=>setF({...f,remember:e.target.checked})}/><span>Beni hatırla <small>(Bu cihazda oturumum açık kalsın.)</small></span></label>
     <label className="check-line"><input type="checkbox" checked={f.accept} onChange={e=>setF({...f,accept:e.target.checked})} required/><span>Soru metinlerimin ve fotoğraflarımın çözüm hazırlamak için yapay zekâ hizmetine gönderilmesini ve <a href="#gizlilik" onClick={e=>{e.preventDefault();toast.message('Gizlilik',{description:'Verilerin yalnızca senin hesabına bağlıdır; kimseyle paylaşılmaz ve reklam için kullanılmaz. Fotoğraflar yalnızca çözüm hazırlanırken yapay zekâ hizmetine gönderilir ve orada saklanmaz. Hesabını Ayarlar\'dan istediğin zaman tüm verileriyle silebilirsin.'})}}>gizlilik ilkelerini</a> kabul ediyorum.</span></label>
    </>}
    {error&&<div className="error-banner" role="alert">{error}</div>}
    <button type="submit" className="primary full" disabled={busy}>{busy?<LoaderCircle className="spin" size={18}/>:mode==='forgot'?(resetStep==='email'?<Mail size={18}/>:<Check size={18}/>):isDevEmail?<Terminal size={18}/>:mode==='login'?<LogIn size={18}/>:<UserPlus size={18}/>} {submitLabel}</button>
    {mode==='register'&&<p className="auth-price">{priceSummary()} Şu an ödeme alınmıyor.</p>}
    {mode==='forgot'&&resetStep==='code'&&<button type="button" className="secondary full" disabled={busy} onClick={()=>{setResetStep('email');setError('')}}><ArrowLeft size={16}/> E-postayı değiştir</button>}
    {mode==='login'&&isAnyDevEmail&&!isDevEmail&&<button type="button" className="secondary full" disabled={busy} onClick={()=>void loginAsDeveloper()}><Terminal size={16}/> Şifresiz giriş yap</button>}
   </form>
   {mode==='login'?<p className="auth-switch">Hesabın yok mu? <button type="button" onClick={()=>{setMode('register');setError('')}} disabled={!open}>Kayıt ol</button></p>:<p className="auth-switch">Hesabın var mı? <button type="button" onClick={()=>{setMode('login');setError('')}}>Giriş yap</button></p>}
   <p className="auth-safe"><ShieldCheck size={15}/> Şifren şifrelenmiş saklanır; verilerini yalnızca sen görürsün.</p>
  </section>
 </div></div>}

// Sosyal girişle ilk girişte (veya profili hiç kaydedilmemişse) kısa kurulum
export function Onboarding({open,profile,onSave}:{open:boolean;profile:Profile;onSave:(p:Profile)=>void}){
 const [f,setF]=useState<Profile>(profile);const [busy,setBusy]=useState(false);
 useEffect(()=>{if(open)setF(profile)},[open,profile]);
 function setGrade(g:string){const y=defaultExamYear(g);setF(p=>({...p,grade:g as Profile['grade'],examYear:y,examDate:estimatedExamDate(y)}))}
 async function save(e:React.FormEvent){e.preventDefault();setBusy(true);try{const d=await postJson('/api/profile',{...f,dailyGoal:Number(f.dailyGoal)||0},'PUT');const email=readSetting('remembered-email','');if(email&&d.profile)writeSetting('profile:'+email,JSON.stringify(d.profile));onSave(d.profile);toast.success('Profilin hazır.')}catch(err){toast.error((err as Error).message)}finally{setBusy(false)}}
 return <Dialog open={open} onOpenChange={()=>{}}><DialogContent className="upload-dialog onboarding" showCloseButton={false}><DialogHeader><DialogTitle>Profilini tamamla</DialogTitle><DialogDescription>Sınavına kalan gün, sınıfına uygun konular ve ders notların bu bilgilere göre hazırlanır.</DialogDescription></DialogHeader>
  <form onSubmit={save}><div className="form-grid"><label>Ad soyad<input required minLength={2} maxLength={60} value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></label><label>Sınıf<Choice label="Sınıf" value={f.grade} onChange={setGrade} values={grades}/></label><label>Sınav yılı<input type="number" min={2026} max={2035} value={f.examYear} onChange={e=>{const y=Number(e.target.value)||f.examYear;setF({...f,examYear:y,examDate:estimatedExamDate(y)})}}/></label><label>Hedef bölüm <small>isteğe bağlı</small><input maxLength={80} placeholder="Tıp" value={f.target} onChange={e=>setF({...f,target:e.target.value})}/></label></div>
  <p className="inline-note">Sınav tarihi tahmini olarak {new Date(f.examDate+'T12:00:00').toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'})} alındı. Kesin tarih açıklanınca Ayarlar'dan güncelle. ({gradeLabel(f.grade)})</p>
  <button type="submit" className="primary full" disabled={busy}>{busy?<LoaderCircle className="spin" size={18}/>:<Check size={18}/>} Kaydet ve başla</button></form></DialogContent></Dialog>}
