"use client";
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {Plus,LayoutDashboard,Table2,ChartNoAxesCombined,Settings,GraduationCap,AlertCircle,Printer,TrendingUp,NotebookPen,Menu,LoaderCircle,Sun,CalendarDays,Wand2} from 'lucide-react';
import {SidebarProvider,Sidebar,SidebarContent,SidebarHeader,SidebarFooter,SidebarMenu,SidebarMenuItem,SidebarMenuButton,SidebarInset,SidebarTrigger,useSidebar} from '@/components/ui/sidebar';
import {Toaster} from '@/components/ui/sonner';
import {toast} from 'sonner';
import {subjects,today,monthlyTopics,dueQuestions,defaultProfile,initials,genitive,type Question,type Exam,type Goal,type Profile} from '@/lib/study';
import {StudyContext,api,postJson,readSetting,writeSetting,ApiError,dates,monthLabel,type View,type Study,type Usage,type Account,type AiKind,type UploadPreset} from './study/shared';
import type {PlanState,Lesson} from '@/lib/plan/scheduler';
import {TodayView} from './study/plan/today';
import {ProgramView} from './study/plan/program';
import {PlanWizard} from './study/plan/wizard';
import {AlarmCenter} from './study/plan/alarm';
import {LessonVideoDialog} from './study/plan/ui';
import {AuthScreen,Onboarding} from './study/auth';
import {Landing,type AuthMode} from './study/landing';
import {Logo} from './study/logo';
import {ArchiveView} from './study/archive';
import {ReportView} from './study/report';
import {ExamsView} from './study/exams';
import {SettingsView} from './study/settings';
import {NotesView} from './study/notes';
import {UploadDialog} from './study/upload-dialog';
import {QuestionDialog} from './study/question-dialog';
const planNav:{icon:typeof LayoutDashboard;label:string;id:View}[]=[{icon:Sun,label:'Bugün',id:'home'},{icon:CalendarDays,label:'Haftalık program',id:'program'}];
const bookNav:{icon:typeof LayoutDashboard;label:string;id:View}[]=[{icon:Table2,label:'Yanlış arşivim',id:'archive'},{icon:ChartNoAxesCombined,label:'Aylık raporum',id:'report'},{icon:TrendingUp,label:'Denemelerim',id:'exams'},{icon:NotebookPen,label:'Ders notlarım',id:'notes'}];
const nav=[...planNav,...bookNav,{icon:Settings,label:'Ayarlar',id:'settings' as View}];
const headings:Record<View,[string,string,string]>={home:['DERS ÇALIŞMA PROGRAMIM','Bugün.','Günün dersi, saat saat akışın ve yanlış tekrarların tek ekranda.'],program:['KİŞİSEL MAARİF TYT KAMPI','Haftalık program.','Okul, sabit düzen ve sporunla çakışmayan haftalık ders akışın.'],archive:['BİRİKEN SORULAR, KALICI ÖĞRENME','Yanlış arşivim.','Tüm soruların, ders ders ve konu konu bir arada.'],report:['NEYE ÇALIŞACAĞINI BİL','Aylık raporum.','Yanlışlarının işaret ettiği konulara odaklan.'],exams:['NET TAKİBİ','Denemelerim.','Her denemeden sonra netini gir; gelişimini gör.'],notes:['MAARİF MODELİ KONU NOTLARI','Ders notlarım.','Konuyu seç; yapay zekâ sınava dönük notunu hazırlasın, sonra isteğine göre değiştir.'],settings:['KİŞİSEL ÇALIŞMA ALANIN','Ayarlar.','Yapay zekâ bağlantın, hatırlatmaların ve yedeklerin.']};
function LessonItem({name,count,onClick}:{name:string;count:number;onClick:()=>void}){const {setOpenMobile,isMobile}=useSidebar();return <SidebarMenuItem><SidebarMenuButton onClick={()=>{onClick();if(isMobile)setOpenMobile(false)}}><span className={'lesson-dot dot-'+subjects.indexOf(name)%4}/><span>{name}</span><span className="lesson-count">{count}</span></SidebarMenuButton></SidebarMenuItem>}
function MobileBar({view,setView,due,openUpload}:{view:View;setView:(v:View)=>void;due:number;openUpload:()=>void}){const {setOpenMobile}=useSidebar();const go=(v:View)=>{setView(v);setOpenMobile(false);window.scrollTo({top:0})};return <nav className="mobile-bar" aria-label="Alt menü"><button className={view==='home'?'on':''} onClick={()=>go('home')}><span className="ico"><Sun size={22}/>{due>0&&<i className="dot">{due}</i>}</span><small>Bugün</small></button><button className={view==='program'?'on':''} onClick={()=>go('program')}><span className="ico"><CalendarDays size={22}/></span><small>Program</small></button><button className="fab" onClick={openUpload} aria-label="Yanlış ekle"><Plus size={26}/></button><button className={view==='archive'?'on':''} onClick={()=>go('archive')}><span className="ico"><Table2 size={22}/></span><small>Arşiv</small></button><button className={['report','exams','notes','settings'].includes(view)?'on':''} onClick={()=>setOpenMobile(true)}><span className="ico"><Menu size={22}/></span><small>Diğer</small></button></nav>}
function NavItem({icon:Icon,label,active,badge,onClick}:{icon:typeof LayoutDashboard;label:string;active:boolean;badge?:number;onClick:()=>void}){const {setOpenMobile,isMobile}=useSidebar();return <SidebarMenuItem><SidebarMenuButton onClick={()=>{onClick();if(isMobile)setOpenMobile(false)}} isActive={active}><Icon size={19}/><span>{label}</span>{badge?<span className="lesson-count due">{badge}</span>:null}</SidebarMenuButton></SidebarMenuItem>}
export default function StudyApp(){
 const [view,setView]=useState<View>('home'),[rows,setRows]=useState<Question[]>([]),[exams,setExams]=useState<Exam[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[authed,setAuthed]=useState<boolean|null>(null),[ai,setAi]=useState(false),[youtube,setYoutube]=useState(false),[supabase,setSupabase]=useState(false),[user,setUser]=useState<Account|null>(null),[usage,setUsage]=useState<Usage|null>(null),[profileSet,setProfileSet]=useState(true),[plan,setPlan]=useState<PlanState|null>(null),[wizard,setWizard]=useState(false),[uploadPreset,setUploadPreset]=useState<UploadPreset|null>(null),[authMode,setAuthMode]=useState<AuthMode|null>(null);
 const [upload,setUpload]=useState(false),[uploadFiles,setUploadFiles]=useState<File[]>([]),[selected,setSelected]=useState<Question|null>(null),[lessonVideo,setLessonVideo]=useState<Lesson|null>(null),[solving,setSolving]=useState<Set<string>>(new Set()),[busy]=useState(false);
 const [subject,setSubject]=useState('Tüm dersler'),[month,setMonth]=useState(today().slice(0,7)),[notes,setNotes]=useState(''),[goals,setGoals]=useState<Goal[]>([]),[printOnly,setPrintOnly]=useState<Question|null>(null),[profile,setProfile]=useState<Profile>(defaultProfile),[notesPreset,setNotesPreset]=useState<{subject:string;topic:string;examType?:string}|null>(null);
 const filteredRef=useRef<Question[]>([]);
 const load=useCallback(async()=>{setLoading(true);try{const d=await api('/api/questions');setRows(d.questions);setExams(d.exams||[]);
  let activeProf=d.profile;
  let isProfSet=d.profileSet!==false;
  if(d.user?.email&&d.profile){
   const profKey='profile:'+d.user.email.toLowerCase();
   const cachedRaw=readSetting(profKey,'');
   let cachedProf:Profile|null=null;
   if(cachedRaw){try{cachedProf=JSON.parse(cachedRaw) as Profile}catch{cachedProf=null}}
   const serverIsDefault=!d.profile.target&&!d.profile.school&&!d.profile.motto&&!d.profile.dailyGoal;
   const cachedHasCustom=!!cachedProf&&(!!cachedProf.target||!!cachedProf.school||!!cachedProf.motto||!!cachedProf.dailyGoal||cachedProf.grade!==d.profile.grade);
   if(cachedProf&&cachedProf.name&&(serverIsDefault&&cachedHasCustom||!isProfSet)){
    activeProf=cachedProf;
    isProfSet=true;
    void postJson('/api/profile',{...cachedProf,examYear:Number(cachedProf.examYear),dailyGoal:Number(cachedProf.dailyGoal)||0},'PUT').catch(()=>{});
   }else{
    writeSetting(profKey,JSON.stringify(d.profile));
   }
  }
  if(activeProf)setProfile(activeProf);
  if(d.sessionToken&&readSetting('remember-me','1')!=='0'){
   writeSetting('session-token',d.sessionToken);
  }
  setAi(d.aiReady);setYoutube(!!d.youtubeReady);setSupabase(!!d.supabaseReady);setUser(d.user);setUsage(d.usage||null);setProfileSet(isProfSet);setPlan(d.plan||null);setAuthed(true);setError('')}catch(e){
  if(e instanceof ApiError&&e.status===401){
   writeSetting('session-token','');
   setAuthed(false);setRows([]);setExams([]);
  }else{
   const hasSavedSession=!!readSetting('session-token','');
   if(hasSavedSession){
    setAuthed(true);
    setError((e as Error).message);
   }else{
    setAuthed(false);
    setRows([]);setExams([]);
   }
  }
 }finally{setLoading(false)}},[]);
 useEffect(()=>{void load()},[load]);
 useEffect(()=>{const onOnline=()=>{if(error||authed===false)void load()};window.addEventListener('online',onOnline);return()=>window.removeEventListener('online',onOnline)},[error,authed,load]);
 // Google dönüşü, hata ya da ?kayit ile gelenler tanıtım sayfasını atlayıp doğrudan giriş ekranını görür
 useEffect(()=>{const q=new URLSearchParams(location.search);if(q.get('auth_error')||location.hash.includes('access_token='))setAuthMode('login');else if(q.get('kayit')!==null)setAuthMode('register')},[]);
 // Yeni hesap: programı yoksa kurulum sihirbazını bir kez kendiliğinden aç
 useEffect(()=>{if(authed&&!loading&&profileSet&&!plan&&!rows.length&&user){const k='wizardShown:'+user.email;if(readSetting(k,'')!=='1'){writeSetting(k,'1');setWizard(true)}}},[authed,loading,profileSet,plan,rows.length,user]);
 useEffect(()=>{if(selected){const fresh=rows.find(q=>q.id===selected.id);if(fresh&&fresh!==selected)setSelected(fresh)}},[rows,selected]);
 useEffect(()=>{const clearPrint=()=>setPrintOnly(null);window.addEventListener('afterprint',clearPrint);return()=>window.removeEventListener('afterprint',clearPrint)},[]);
 const upsert=useCallback((q:Question)=>{setRows(old=>[q,...old.filter(r=>r.id!==q.id)].sort((a,b)=>b.date.localeCompare(a.date)||b.created_at.localeCompare(a.created_at)))},[]);
 const bumpUsage=useCallback((k:AiKind)=>setUsage(u=>u?{...u,[k]:{...u,[k]:{...u[k],used:u[k].used+1}}}[k]?{...u,[k]:{...u[k],used:u[k].used+1}}:u:u),[]);
 const logout=useCallback(async()=>{try{await api('/api/auth/logout',{method:'POST'})}catch{}writeSetting('session-token','');setSelected(null);setLessonVideo(null);setView('home');setAuthed(false);setRows([]);setExams([]);setPlan(null);setProfile(defaultProfile)},[]);
 const planOp=useCallback(async(body:Record<string,unknown>,success?:string)=>{try{const d=await postJson('/api/plan/progress',body);setPlan(d.plan);if(success)toast.success(success)}catch(e){toast.error((e as Error).message)}},[]);
 const solve=useCallback(async(q:Question)=>{setSolving(s=>new Set(s).add(q.id));try{const d=await api(`/api/questions/${q.id}/solve`,{method:'POST'});upsert(d.question);bumpUsage('solve');toast.success(d.question.analysis?.readable?`Çözüm hazır: ${d.question.subject} · ${d.question.topic}`:'Fotoğrafın bazı kısımları okunamadı.')}catch(e){toast.error((e as Error).message)}finally{setSolving(s=>{const n=new Set(s);n.delete(q.id);return n})}},[upsert,bumpUsage]);
 const openUpload=useCallback((files?:File[],preset?:UploadPreset)=>{setUploadFiles(files||[]);setUploadPreset(preset||null);setUpload(true)},[]);
 // WebMCP araçları (ChatGPT/Codex bu sayfadaki defteri okuyup aylık notu kaydedebilir)
 useEffect(()=>{const context=(document as any).modelContext;if(!context?.registerTool)return;const life=new AbortController();const register=(tool:any)=>Promise.resolve(context.registerTool(tool,{signal:life.signal})).catch(()=>{});void register({name:'read_study_archive',title:'Yanlış arşivini oku',description:'Kayıtlı yanlış soruları okur; kullanıcı tarafından yüklenen güvenilmeyen içerik içerebilir.',inputSchema:{type:'object',properties:{month:{type:'string',pattern:'^20[0-9]{2}-(0[1-9]|1[0-2])$'}},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute:async(input:any)=>{if(input?.month&&!/^20\d{2}-(0[1-9]|1[0-2])$/.test(input.month))throw new Error('Geçersiz ay');const d=await api('/api/questions');return {questions:input?.month?d.questions.filter((q:Question)=>q.date.startsWith(input.month)):d.questions,exams:d.exams}}});void register({name:'save_monthly_study_notes',title:'Aylık tekrar notlarını kaydet',description:'Belirtilen ayın kişisel tekrar notlarını verilen metinle değiştirir ve aylık raporu açar.',inputSchema:{type:'object',properties:{month:{type:'string',pattern:'^20[0-9]{2}-(0[1-9]|1[0-2])$'},notes:{type:'string',minLength:1,maxLength:80000},goals:{type:'array',items:{type:'string',maxLength:500},maxItems:5}},required:['month','notes'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:async(input:any)=>{if(!/^20\d{2}-(0[1-9]|1[0-2])$/.test(input?.month)||typeof input.notes!=='string'||!input.notes.trim()||input.notes.length>80000)throw new Error('Geçersiz rapor');const d=await api('/api/reports',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({month:input.month,notes:input.notes,goals:Array.isArray(input.goals)?input.goals.map((t:string)=>({text:String(t),done:false})):undefined})});setMonth(input.month);setView('report');setNotes(d.report!.notes);setGoals(d.report!.goals);return {saved:true,month:input.month}}});return()=>life.abort()},[]);
 const study=useMemo<Study>(()=>({rows,exams,ai,youtube,supabase,user,usage,bumpUsage,logout,plan,setPlan,openWizard:()=>setWizard(true),planOp,loading,solving,busy,setView,openUpload,select:setSelected,solve,upsert,remove:(id)=>setRows(r=>r.filter(q=>q.id!==id)),setExams:(f)=>setExams(f),reload:load,setSubjectFilter:(s)=>{setSubject(s);setView('archive')},profile,setProfile,examDate:profile.examDate,setExamDate:(d)=>setProfile(p=>({...p,examDate:d})),openNotes:(p)=>{setNotesPreset(p);setSelected(null);setView('notes')},openLessonVideo:(l)=>setLessonVideo(l)}),[rows,exams,ai,youtube,supabase,user,usage,bumpUsage,logout,plan,planOp,loading,solving,busy,openUpload,solve,upsert,load,profile]);
 function print(q:Question|null=null){setPrintOnly(q);setTimeout(()=>window.print(),150)}
 const due=dueQuestions(rows).length;const topics=monthlyTopics(rows,month);
 if(authed===false)return <><Toaster richColors position="top-center"/>{authMode?<AuthScreen initialMode={authMode} onBack={()=>setAuthMode(null)} onDone={()=>{setAuthed(null);setAuthMode(null);void load()}}/>:<Landing onAuth={setAuthMode}/>}</>;
 if(authed===null)return <div className="boot"><Logo size={34}/><LoaderCircle className="spin" size={22}/></div>;
 const firstName=profile.name.split(' ')[0]||'';
 return <StudyContext.Provider value={study}><Toaster richColors position="top-center"/><SidebarProvider><Sidebar className="app-sidebar"><SidebarHeader><button className="brand" onClick={()=>setView('home')}><Logo size={28}/><small>DERS ÇALIŞMA PROGRAMI · YKS {profile.examYear}</small></button></SidebarHeader><SidebarContent><p className="nav-label">PROGRAMIM</p><SidebarMenu>{planNav.map(({icon,label,id})=><NavItem key={id} icon={icon} label={label} active={view===id} badge={id==='home'?due:0} onClick={()=>{setView(id);window.scrollTo({top:0})}}/>)}{!plan&&<NavItem icon={Wand2} label="Program oluştur" active={false} onClick={()=>setWizard(true)}/>}</SidebarMenu><p className="nav-label lesson-label">DEFTERİM</p><SidebarMenu>{bookNav.map(({icon,label,id})=><NavItem key={id} icon={icon} label={label} active={view===id} onClick={()=>{setView(id);window.scrollTo({top:0})}}/>)}<NavItem icon={Settings} label="Ayarlar" active={view==='settings'} onClick={()=>{setView('settings');window.scrollTo({top:0})}}/></SidebarMenu><p className="nav-label lesson-label">DERSLERİM</p><SidebarMenu>{subjects.filter(s=>rows.some(q=>q.subject===s)).map(s=><LessonItem key={s} name={s} count={rows.filter(q=>q.subject===s).length} onClick={()=>{setSubject(s);setView('archive');window.scrollTo({top:0})}}/>)}</SidebarMenu>{!rows.length&&<p className="sidebar-hint">Soru eklediğinde derslerin burada görünecek.</p>}</SidebarContent><SidebarFooter><div className="target-card"><GraduationCap/><strong>Hedef: YKS {profile.examYear}{profile.target?` · ${profile.target}`:''}</strong><p>{profile.motto||'Her yanlış, bir sonraki doğruya.'}</p></div><button className="profile" onClick={()=>setView('settings')} title="Profili düzenle"><span>{initials(profile.name||user?.name||'?')}</span><div>{profile.name||user?.name}<small>{profile.grade==='Mezun'?'Mezun':profile.grade+'. sınıf'}{profile.school?` · ${profile.school}`:''} · YKS {profile.examYear}</small></div></button></SidebarFooter></Sidebar>
 <SidebarInset><header className="topbar"><SidebarTrigger/><span className="crumb"><span className="crumb-root">{planNav.some(n=>n.id===view)?'Programım':'Defterim'} / </span><b>{nav.find(n=>n.id===view)?.label}</b></span><div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>{(user?.developer||supabase)&&<button type="button" onClick={()=>setView('settings')} className={'status '+(supabase?'good':'pending')} style={{border:'none',cursor:'pointer'}} title="Supabase Bağlantı Durumu">{supabase?'Supabase Bağlı':'Supabase Bağlanmadı'}</button>}{(user?.developer||ai)&&<button type="button" onClick={()=>setView('settings')} className={'status '+(ai?'good':'pending')} style={{border:'none',cursor:'pointer'}} title="OpenAI API Bağlantı Durumu">{ai?'OpenAI API Bağlı':'OpenAI API Bağlanmadı'}</button>}<span className="private-label" style={{marginLeft:0}}>{firstName?`${genitive(firstName)} programı`:'Programım'}</span></div></header><main className="workspace">
 {error&&<div className="error-banner" role="alert"><AlertCircle size={20}/><span>{error}</span><button onClick={()=>void load()}>Tekrar dene</button></div>}
 <div className="page-heading"><div><p className="eyebrow">{headings[view][0]}</p><h1>{headings[view][1]}</h1><p>{headings[view][2]}</p></div><div className="actions">{(view==='archive'||view==='report')&&<button className="secondary" onClick={()=>print()}><Printer size={17}/> Yazdır / PDF</button>}{(view==='home'||view==='program')&&<button className="secondary" onClick={()=>setWizard(true)}><Wand2 size={17}/> {plan?'Programı düzenle':'Program oluştur'}</button>}{view!=='settings'&&view!=='notes'&&<button className="primary" onClick={()=>openUpload()}><Plus size={18}/> Yanlış ekle</button>}</div></div>
 {view==='home'&&<TodayView/>}
 {view==='program'&&<ProgramView/>}
 {view==='archive'&&<ArchiveView subject={subject} setSubject={setSubject} filteredRef={filteredRef}/>}
 {view==='report'&&<ReportView month={month} setMonth={setMonth} notes={notes} setNotes={setNotes} goals={goals} setGoals={setGoals} onPrint={()=>print()}/>}
 {view==='exams'&&<ExamsView/>}
 {view==='notes'&&<NotesView preset={notesPreset}/>}
 {view==='settings'&&<SettingsView/>}
 </main><MobileBar view={view} setView={setView} due={due} openUpload={()=>openUpload()}/></SidebarInset></SidebarProvider>
 <UploadDialog open={upload} files={uploadFiles} preset={uploadPreset} onClose={()=>setUpload(false)}/>
 <PlanWizard open={wizard} onClose={()=>setWizard(false)}/>
 <AlarmCenter/>
 <LessonVideoDialog lesson={lessonVideo} onClose={()=>setLessonVideo(null)}/>
 <QuestionDialog question={selected} onClose={()=>setSelected(null)} onPrint={q=>print(q)}/>
 <Onboarding open={!loading&&authed===true&&!profileSet} profile={{...profile,name:profile.name||user?.name||''}} onSave={p=>{setProfile(p);setProfileSet(true);if(!plan)setWizard(true)}}/>
 {view!=='notes'&&<section id="print-out"><h1>{profile.name?profile.name+' · ':''}netudu · YKS {profile.examYear}</h1><p>{view==='report'&&!printOnly?monthLabel(month)+' — Aylık tekrar raporu':'Yanlış soru arşivi'} · {dates(today())}</p>{view==='report'&&!printOnly?<><h2>En çok yanlış yüklenen konular</h2>{topics.map(t=><div key={t.subject+t.topic}><h3>{t.subject} — {t.topic}: {t.count} yanlış{t.prev?` (geçen ay ${t.prev})`:''}</h3>{t.notes.slice(0,2).map((n,i)=><p key={i}>{n}</p>)}</div>)}<h2>Kişisel tekrar notlarım</h2><p className="prewrap">{notes||'Henüz aylık not kaydedilmedi.'}</p>{goals.length?<><h2>Gelecek ay hedeflerim</h2><ul>{goals.map((g,i)=><li key={i}>{g.done?'[x]':'[ ]'} {g.text}</li>)}</ul></>:null}</>:(printOnly?[printOnly]:(view==='archive'?filteredRef.current:rows)).map((q,i)=><article className="printed-question" key={q.id}><h2>{i+1}. {q.subject} — {q.topic}</h2><p>{q.exam} · {q.exam_type} · {dates(q.date)}</p>{q.image_key&&<img src={`/api/questions/${q.id}/image`} alt="Soru fotoğrafı"/>}<p className="prewrap">{q.question}</p><p>Cevabım: {q.my_answer||'—'} · Cevap anahtarı: {q.answer_key||'—'}</p>{q.analysis?.readable&&<><h3>Sonuç: {q.analysis.answer}</h3><ol>{q.analysis.steps.map((s,j)=><li key={j}>{s}</li>)}</ol><p>{q.analysis.pitfall}</p><p>{q.analysis.note}</p>{q.analysis.videos?.map(v=><p key={v.url}>{v.title}: {v.url}</p>)}</>}</article>)}</section>}
 </StudyContext.Provider>}
