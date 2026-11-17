import * as React from 'react';
import {renderToStaticMarkup as R} from 'react-dom/server';
import {Landing} from '@/app/study/landing';
import {AppFrame} from '@/app/study/shell';
import {StudyContext} from '@/app/study/shared';
import {TodayView} from '@/app/study/plan/today';
import {ArchiveView} from '@/app/study/archive';
import {NotesView} from '@/app/study/notes';
import {SettingsView} from '@/app/study/settings';
import {ProgramView} from '@/app/study/plan/program';
import {ResourcesView} from '@/app/study/plan/resources';
import {ReportView} from '@/app/study/report';
import {ExamsView} from '@/app/study/exams';
import {defaultPlanConfig} from '@/lib/plan/scheduler';
import {defaultProfile,type Question} from '@/lib/study';

export const profile={...defaultProfile,name:'Ayşe Yılmaz',grade:'12' as const,school:'Atatürk Anadolu Lisesi',target:'Tıp',examYear:2027,examDate:'2027-06-19',motto:''};
const sub=['Matematik','Fizik','Kimya','Biyoloji','Türk Dili ve Edebiyatı'];
export const rows:Question[]=Array.from({length:6},(_,i)=>({id:'q'+i,exam:'',exam_type:i%2?'TYT':'AYT',date:'2026-11-1'+(i+1),subject:sub[i%5],topic:['Türev','Elektrik','Mol kavramı','Hücre','Paragraf','Limit'][i],question:'Örnek soru '+(i+1),my_answer:'B',answer_key:'C',image_key:null,analysis:null,reviewed:0,created_at:'2026-11-1'+(i+1)+'T10:00:00Z',mistake_type:'yanlış',review_stage:0,next_review:'2026-11-17',review_log:[]})) as any;
export const study:any={rows,exams:[],ai:true,youtube:false,supabase:true,user:{email:'ornek@example.com',name:'Ayşe Yılmaz',developer:true},usage:null,bumpUsage(){},logout:async()=>{},plan:null,setPlan(){},openWizard(){},planOp:async()=>{},resourceOp:async()=>true,resourceBusy:{},loading:false,solving:new Set(),busy:false,setView(){},openUpload(){},select(){},solve:async()=>{},upsert(){},remove(){},setExams(){},reload:async()=>{},setSubjectFilter(){},profile,setProfile(){},examDate:profile.examDate,setExamDate(){},openNotes(){},openLessonVideo(){}};
const body=(view:string)=>view==='home'?<TodayView/>:view==='archive'?<ArchiveView subject="Tüm dersler" setSubject={()=>{}} filteredRef={{current:[]}} onPrint={()=>{}}/>:view==='notes'?<NotesView preset={null}/>:view==='settings'?<SettingsView/>:view==='program'?<ProgramView/>:view==='resources'?<ResourcesView/>:view==='report'?<ReportView month="2026-11" notes="" setNotes={()=>{}} goals={[]} setGoals={()=>{}} onPrint={()=>{}}/>:view==='exams'?<ExamsView/>:null;
// Plan örneği: bugünden başlayan varsayılan yapılandırma (kaynak yok)
export const samplePlan=()=>({config:defaultPlanConfig(new Date().toISOString().slice(0,10),'12'),done:{},offDays:{}});
const props=(view:string,o:any)=>({view,setView(){},plan:null,due:4,rows,profile,user:study.user,supabase:true,ai:true,examDays:216,error:'',load(){},onRetry(){},openUpload(){},openWizard(){},onPrint(){},print(){},setSubject(){},setWizard(){},...o});
export const landing=()=>R(<Landing onAuth={()=>{}}/>);
// o.withPlan: plan var; o.dev=false: geliştirici olmayan kullanıcı
export const oldProps=(view:string,o:any={})=>{const plan=o.withPlan?samplePlan():null;const user={...study.user,developer:o.dev!==false};
 return {study:{...study,plan,user,...(o.study||{})},props:props(view,{plan,user,...o}),body:o.body??body(view)}};
export const shell=(view:string,o:any={})=>{const {study:st,props:pr,body:b}=oldProps(view,o);return R(<StudyContext.Provider value={st}><AppFrame {...(pr as any)}>{b}</AppFrame></StudyContext.Provider>)};
