"use client";
import type {ReactNode} from 'react';
import {Plus,Table2,ChartNoAxesCombined,Settings,CalendarClock,AlertCircle,Printer,TrendingUp,NotebookPen,Menu,Sun,CalendarDays,Wand2,List} from '@/components/icons';
import {SidebarProvider,Sidebar,SidebarContent,SidebarHeader,SidebarFooter,SidebarMenu,SidebarMenuItem,SidebarMenuButton,SidebarInset,SidebarTrigger,useSidebar} from '@/components/ui/sidebar';
import {subjects,subjectCount,isUnrecognized,PENDING_FILTER,initials,genitive,type Question,type Profile} from '@/lib/study';
import {planNavEntries,bookNavEntries,settingsEntry,headings,pageActions,topbarAddVariant,contentWidth,type NavEntry} from '@/lib/shell';
import type {PlanState} from '@/lib/plan/scheduler';
import type {View,Account} from './shared';
import {Logo} from './logo';

// Kabuk bileşenleri: kenar çubuğu, üst çubuk, sayfa başlığı ve mobil alt çubuk. Mantık lib/shell.ts içindedir.
const icons:Record<View,typeof Sun>={home:Sun,program:CalendarDays,resources:List,archive:Table2,report:ChartNoAxesCombined,exams:TrendingUp,notes:NotebookPen,settings:Settings};

function LessonItem({name,count,onClick}:{name:string;count:number;onClick:()=>void}){const {setOpenMobile,isMobile}=useSidebar();return <SidebarMenuItem><SidebarMenuButton onClick={()=>{onClick();if(isMobile)setOpenMobile(false)}}><span className={'lesson-dot dot-'+subjects.indexOf(name)%4}/><span>{name}</span><span className="lesson-count">{count}</span></SidebarMenuButton></SidebarMenuItem>}
function NavItem({entry,active,badge,onClick}:{entry:NavEntry;active:boolean;badge?:number;onClick:()=>void}){const {setOpenMobile,isMobile}=useSidebar();const Icon=icons[entry.id];return <SidebarMenuItem><SidebarMenuButton onClick={()=>{onClick();if(isMobile)setOpenMobile(false)}} isActive={active}><Icon size={19}/><span>{entry.label}</span>{badge?<span className="lesson-count due">{badge}</span>:null}</SidebarMenuButton></SidebarMenuItem>}
function MobileBar({view,setView,due,openUpload}:{view:View;setView:(v:View)=>void;due:number;openUpload:()=>void}){const {setOpenMobile}=useSidebar();const go=(v:View)=>{setView(v);setOpenMobile(false);window.scrollTo({top:0})};return <nav className="mobile-bar" aria-label="Alt menü"><button className={view==='home'?'on':''} onClick={()=>go('home')}><span className="ico"><Sun size={22}/>{due>0&&<i className="dot">{due}</i>}</span><small>Bugün</small></button><button className={view==='program'?'on':''} onClick={()=>go('program')}><span className="ico"><CalendarDays size={22}/></span><small>Program</small></button><button className="fab" onClick={openUpload} aria-label="Yanlış ekle"><Plus size={26}/></button><button className={view==='archive'?'on':''} onClick={()=>go('archive')}><span className="ico"><Table2 size={22}/></span><small>Defter</small></button><button className={['resources','report','exams','notes','settings'].includes(view)?'on':''} onClick={()=>setOpenMobile(true)}><span className="ico"><Menu size={22}/></span><small>Daha fazla</small></button></nav>}

export type FrameProps={view:View;setView:(v:View)=>void;plan:PlanState|null;due:number;rows:Question[];profile:Profile;user:Account|null;examDays:number;error:string;onRetry:()=>void;openUpload:()=>void;openWizard:()=>void;onPrint:()=>void;setSubject:(s:string)=>void;children:ReactNode};

// Sol kenar çubuğu + üst çubuk + sayfa başlığı + içerik + alt çubuk; StudyApp yalnız ekran gövdesini children olarak verir
export function AppFrame(p:FrameProps){
 const {view,setView,plan,due,rows,profile,user,examDays}=p;
 const go=(v:View)=>{setView(v);window.scrollTo({top:0})};
 const goSubject=(s:string)=>{p.setSubject(s);go('archive')};
 const firstName=profile.name.split(' ')[0]||'';
 const actions=pageActions(view,{plan:!!plan});const head=headings[view];
 return <SidebarProvider><Sidebar className="app-sidebar"><SidebarHeader><button className="brand" onClick={()=>setView('home')}><Logo size={28}/><small>YKS {profile.examYear}</small></button></SidebarHeader>
  <SidebarContent><p className="nav-label">PROGRAM</p><SidebarMenu>{planNavEntries.map(e=><NavItem key={e.id} entry={e} active={view===e.id} badge={e.id==='home'?due:0} onClick={()=>go(e.id)}/>)}</SidebarMenu>
   <p className="nav-label lesson-label">DEFTER</p><SidebarMenu>{[...bookNavEntries,settingsEntry].map(e=><NavItem key={e.id} entry={e} active={view===e.id} onClick={()=>go(e.id)}/>)}</SidebarMenu>
   {rows.length>0&&<><p className="nav-label lesson-label">DERSLER</p><SidebarMenu>{subjects.filter(s=>subjectCount(rows,s)>0).map(s=><LessonItem key={s} name={s} count={subjectCount(rows,s)} onClick={()=>goSubject(s)}/>)}{rows.some(isUnrecognized)&&<LessonItem name={PENDING_FILTER} count={rows.filter(isUnrecognized).length} onClick={()=>goSubject(PENDING_FILTER)}/>}</SidebarMenu></>}</SidebarContent>
  <SidebarFooter><div className="target-card"><span className="eyebrow">HEDEF · YKS {profile.examYear}{profile.target?` · ${profile.target}`:''}</span>{examDays>0?<strong><CalendarClock size={18} aria-hidden="true"/> {examDays} gün kaldı</strong>:<strong>{examDays===0?'Sınav günü. Başarılar.':'Sınav tarihini güncelle'}</strong>}{profile.motto&&<p>{profile.motto}</p>}</div><button className="profile" onClick={()=>setView('settings')} title="Profili düzenle"><span>{initials(profile.name||user?.name||'?')}</span><div>{profile.name||user?.name}<small>{profile.grade==='Mezun'?'Mezun':profile.grade+'. sınıf'}{profile.school?` · ${profile.school}`:''} · YKS {profile.examYear}</small></div></button></SidebarFooter></Sidebar>
  <SidebarInset><header className="topbar"><SidebarTrigger/><button type="button" className="topbar-logo" onClick={()=>setView('home')} aria-label="netudu, Bugün"><Logo size={24}/></button>
   <div className="topbar-end"><button type="button" className={'topbar-add '+topbarAddVariant(view,!!plan)} onClick={p.openUpload}><Plus size={18} aria-hidden="true"/> Yanlış ekle</button><span className="private-label">{firstName?`${genitive(firstName)} programı`:'Programın'}</span></div></header>
   <main className="workspace">
    {p.error&&<div className="error-banner" role="alert"><AlertCircle size={20}/><span>{p.error}</span><button onClick={p.onRetry}>Tekrar dene</button></div>}
    <div className={'page-heading'+(view==='home'?' compact':'')}>{view!=='home'&&<div><h1>{head.title}</h1><p>{head.description}</p></div>}<div className="actions">{actions.includes('print')&&<button className="secondary" onClick={p.onPrint}><Printer size={17}/> Yazdır / PDF</button>}{actions.includes('edit-plan')&&<button className="secondary ghost" onClick={p.openWizard}><Wand2 size={17}/> Programı düzenle</button>}</div></div>
    <div className="view" key={view} data-view={view} data-width={contentWidth(view)}>{p.children}</div>
   </main><MobileBar view={view} setView={setView} due={due} openUpload={p.openUpload}/></SidebarInset></SidebarProvider>
}
