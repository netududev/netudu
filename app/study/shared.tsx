"use client";
import {createContext,useContext,useEffect,useRef,useState} from 'react';
import {BookOpen} from '@/components/icons';
import {Select,SelectTrigger,SelectValue,SelectContent,SelectItem} from '@/components/ui/select';
import {topicOptions,mebGrades,gradeOfExam,type Question,type Exam,type Report,type Video,type StudyNote,type Profile} from '@/lib/study';
import type {PlanState,Lesson} from '@/lib/plan/scheduler';
import type {PlaylistItem} from '@/lib/plan/resources';
export type View='home'|'program'|'resources'|'archive'|'report'|'exams'|'notes'|'settings';
export type AiKind='solve'|'note'|'report'|'video'|'quote';
export type Usage=Record<AiKind,{used:number;limit:number}>&{unlimited:boolean};
export type Account={
 id?:string;
 name:string;
 email:string;
 admin:boolean;
 developer?:boolean;
 hasPassword:boolean;
 google:boolean;
 tenantId?:string;
 tenantName?:string;
 tenantRole?:'owner'|'admin'|'member';
 authProvider?:'supabase'|'local';
 createdAt?:string;
};
export type ApiResponse={error?:string;sessionToken?:string;questions:Question[];question:Question;exams:Exam[];exam:Exam;aiReady:boolean;youtubeReady:boolean;supabaseReady?:boolean;user:Account|null;usage:Usage;profileSet:boolean;plan:PlanState|null;report:Report|null;previous:Report|null;videos:Video[];notice:string;added:number;received:number;notes:StudyNote[];note:StudyNote|null;profile:Profile;playlist?:{listId:string;total:number;items:PlaylistItem[]}};
export type UploadPreset={subject?:string;topic?:string;examType?:string;exam?:string;question?:string};
export class ApiError extends Error{constructor(message:string,public status:number){super(message)}}
export function authHeaders(extra?:Record<string,string>):Record<string,string>{
 const sTok=readSetting('session-token','');
 return {
  'x-requested-with':'netudu',
  ...(sTok?{'x-session-token':sTok}:{}),
  ...(extra||{})
 };
}
export async function api(url:string,init?:RequestInit){
 const maxTries=2;
 let lastErr:unknown=null;
 for(let attempt=0;attempt<=maxTries;attempt++){
  try{
   const mergedInit:RequestInit={
    credentials:'include',
    ...init,
    headers:authHeaders((init?.headers as Record<string,string>)||{})
   };
   const r=await fetch(url,mergedInit);
   if((r.status===502||r.status===503||r.status===504)&&attempt<maxTries){
    await new Promise(res=>setTimeout(res,350*(attempt+1)));
    continue;
   }
   let data:ApiResponse;
   try{
    data=await r.json() as ApiResponse;
   }catch{
    if(attempt<maxTries){
     await new Promise(res=>setTimeout(res,350*(attempt+1)));
     continue;
    }
    throw new ApiError('Beklenmeyen bir yanıt geldi. Tekrar dene.',r.status);
   }
   if(!r.ok)throw new ApiError(data.error||'İşlem tamamlanamadı. Tekrar dene.',r.status);
   if(data.sessionToken&&readSetting('remember-me','1')!=='0'){
    writeSetting('session-token',data.sessionToken);
   }
   return data;
  }catch(e){
   lastErr=e;
   if(e instanceof ApiError)throw e;
   if(attempt<maxTries){
    await new Promise(res=>setTimeout(res,400*(attempt+1)));
    continue;
   }
  }
 }
 if(lastErr instanceof ApiError)throw lastErr;
 throw new ApiError('Bağlanılamadı. İnternet bağlantını kontrol edip tekrar dene.',0);
}
export const postJson=(url:string,body:unknown,method='POST')=>api(url,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
export const dates=(d:string)=>new Date(d+'T12:00:00').toLocaleDateString('tr-TR',{day:'numeric',month:'short',year:'numeric'});
export const monthLabel=(m:string)=>new Date(m+'-01T12:00:00').toLocaleDateString('tr-TR',{month:'long',year:'numeric'});
export function videoId(url:string){try{const u=new URL(url);return u.hostname==='youtu.be'?u.pathname.slice(1):u.searchParams.get('v')||''}catch{return ''}}
export const formatViews=(n?:number)=>!n?'':n>=1e6?(n/1e6).toFixed(1).replace('.0','')+' Mn':n>=1e3?Math.round(n/1e3)+' B':String(n);
export function Choice({value,onChange,values,label,disabled}:{value:string;onChange:(v:string)=>void;values:string[];label:string;disabled?:boolean}){return <Select value={value} onValueChange={onChange} disabled={disabled}><SelectTrigger aria-label={label} className="choice"><SelectValue placeholder={label}/></SelectTrigger><SelectContent>{values.map(v=><SelectItem value={v} key={v}>{v}</SelectItem>)}</SelectContent></Select>}
// "Örnek" iskeleti: gerçek veri değildir; etiketli, ekran okuyuculardan gizli. kind: satır listesi, çizgi grafik ya da tablo
export function SampleSkeleton({kind='rows',label='Önizleme'}:{kind?:'rows'|'chart'|'table';label?:string}){
 return <figure className={'sample sample-'+kind}><figcaption><span className="sample-tag">Örnek</span> {label} · gerçek verin değildir</figcaption>
  <div className="sample-body" aria-hidden="true">
   {kind==='chart'?<svg viewBox="0 0 240 90" preserveAspectRatio="none"><path className="sample-grid" d="M0 22H240M0 45H240M0 68H240"/><path className="sample-line" d="M6 70C40 64 54 50 86 52S140 30 170 28 214 14 234 12"/>{[[6,70],[86,52],[170,28],[234,12]].map(([x,y])=><circle key={x} cx={x} cy={y} r="3.5"/>)}</svg>
   :kind==='table'?[0,1,2].map(i=><div className="sample-row" key={i}><i className="sk-chip"/><i className="sk-bar w60"/><i className="sk-bar w30"/><i className="sk-dot"/></div>)
   :[0,1,2].map(i=><div className="sample-row" key={i}><i className="sk-time"/><i className="sk-pip"/><div className="sk-stack"><i className="sk-bar w60"/><i className="sk-bar w40 thin"/></div><i className="sk-box"/></div>)}
  </div></figure>}
// Boş durum: başlık, açıklama, isteğe bağlı "ne olacak" adımları ve örnek iskeleti
export function Empty({title='Henüz yanlış yok.',children,icon,action,steps,sample,sampleLabel}:{title?:string;children:React.ReactNode;icon?:React.ReactNode;action?:React.ReactNode;steps?:string[];sample?:'rows'|'chart'|'table';sampleLabel?:string}){return <div className={'empty'+(steps||sample?' rich':'')}><span className="empty-ico">{icon||<BookOpen/>}</span><h3>{title}</h3><p>{children}</p>{action}{sample&&<SampleSkeleton kind={sample} label={sampleLabel}/>}{steps&&<ol className="empty-steps">{steps.map((t,i)=><li key={t}><b>{i+1}</b><span>{t}</span></li>)}</ol>}</div>}
// Başlık altı özet şeridi: yalnız gerçek veriden hesaplanan değerler
export function StatStrip({items}:{items:{label:string;value:React.ReactNode;sub?:string}[]}){return <dl className="stat-strip">{items.map(x=><div key={x.label}><dt>{x.label}</dt><dd>{x.value}</dd>{x.sub&&<small>{x.sub}</small>}</div>)}</dl>}
export const mistakeLabel:Record<string,string>={'yanlış':'Yanlış işaretledim','boş':'Boş bıraktım','emin değildim':'Doğru ama emin değildim'};
export function download(blob:Blob,name:string){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000)}
export function readSetting(key:string,fallback:string){try{return localStorage.getItem('net-defterim:'+key)||fallback}catch{return fallback}}
export function writeSetting(key:string,value:string){try{localStorage.setItem('net-defterim:'+key,value)}catch{}}
export type Study={rows:Question[];exams:Exam[];ai:boolean;youtube:boolean;supabase?:boolean;user:Account|null;usage:Usage|null;bumpUsage:(k:AiKind)=>void;logout:()=>Promise<void>;plan:PlanState|null;setPlan:(p:PlanState|null)=>void;openWizard:()=>void;planOp:(body:Record<string,unknown>,success?:string)=>Promise<void>;resourceOp:(body:Record<string,unknown>,success?:string)=>Promise<boolean>;loading:boolean;solving:Set<string>;busy:boolean;setView:(v:View)=>void;openUpload:(files?:File[],preset?:UploadPreset)=>void;select:(q:Question|null)=>void;solve:(q:Question)=>Promise<void>;upsert:(q:Question)=>void;remove:(id:string)=>void;setExams:(f:(e:Exam[])=>Exam[])=>void;reload:()=>Promise<void>;setSubjectFilter:(s:string)=>void;profile:Profile;setProfile:(p:Profile)=>void;examDate:string;setExamDate:(d:string)=>void;openNotes:(p:{subject:string;topic:string;examType?:string})=>void;openLessonVideo:(l:Lesson)=>void};
export const StudyContext=createContext<Study|null>(null);
export function useStudy(){const c=useContext(StudyContext);if(!c)throw new Error('StudyContext eksik');return c}
// MEB ünite/konu menüsü: Ders seçildikten sonra sınıf › ünite gruplarıyla konu listesi. examType "10. Sınıf" gibi bir sınıfsa o sınıf öne alınır.
export function TopicSelect({subject,value,onChange,examType,allowEmpty=true,label='Konu'}:{subject:string;value:string;onChange:(v:string)=>void;examType?:string;allowEmpty?:boolean;label?:string}){const opts=topicOptions(subject);const prefer=gradeOfExam(examType||'');const grades=[...new Set(opts.map(o=>o.grade))].sort((a,b)=>(a===prefer?-1:b===prefer?1:0)||(a==='S'?1:b==='S'?-1:Number(a)-Number(b)));const known=opts.some(o=>o.value===value);
 return <select className="choice-native" aria-label={label} value={known||!value?value:'__custom'} onChange={e=>onChange(e.target.value==='__custom'?value:e.target.value)}>{allowEmpty&&<option value="">Konu seç{prefer?` (${mebGrades[prefer]} önde)`:''}</option>}{!known&&value&&<option value="__custom">{value} (listede yok)</option>}{grades.map(g=>{const units=[...new Set(opts.filter(o=>o.grade===g).map(o=>o.unit))];return units.map(u=><optgroup key={g+u} label={`${mebGrades[g]||g} · ${u}`}>{opts.filter(o=>o.grade===g&&o.unit===u).map(o=><option key={o.grade+o.unit+o.value} value={o.value}>{o.value}</option>)}</optgroup>)})}</select>}
// Günlük yapay zekâ hakkı: kalan sayı (sınırsızsa null)
export const remaining=(u:Usage|null,k:AiKind)=>!u||u.unlimited?null:Math.max(0,u[k].limit-u[k].used);
export const kindLabel:Record<AiKind,string>={solve:'Soru çözümü',note:'Ders notu',report:'Aylık rapor',video:'Video yenileme',quote:'Günün cümlesi'};
export function QuotaNote({kind}:{kind:AiKind}){const s=useStudy();const left=remaining(s.usage,kind);if(left===null||!s.ai)return null;return <span className={'quota-note'+(left===0?' empty':'')}>{left===0?`Bugünkü ${kindLabel[kind].toLocaleLowerCase('tr')} hakkın bitti. Gece yarısı yenilenir`:`Bugün kalan: ${left}/${s.usage![kind].limit} ${kindLabel[kind].toLocaleLowerCase('tr')}`}</span>}

// Sayıların sayarak artması: yalnız gerçek değerlerle çalışır. Hareket azaltma tercihinde ve ilk çizimde kayma olmaması için
// son değer görünmez bir kopyayla yer ayırır (genişlik değişmez).
export function useCountUp(target:number,ms=650){
 const [v,setV]=useState(target),from=useRef(target);
 useEffect(()=>{
  if(!Number.isFinite(target)||typeof matchMedia==='undefined'||matchMedia('(prefers-reduced-motion: reduce)').matches){setV(target);from.current=target;return}
  const a=from.current,b=target,t0=performance.now();let raf=0;
  const step=(t:number)=>{const k=Math.min(1,(t-t0)/ms),e=1-Math.pow(1-k,3);setV(Math.round(a+(b-a)*e));if(k<1)raf=requestAnimationFrame(step);else from.current=b};
  raf=requestAnimationFrame(step);return()=>{cancelAnimationFrame(raf);from.current=b}
 },[target,ms]);
 return v;
}
export function Count({value,format}:{value:number;format?:(n:number)=>string}){const v=useCountUp(value);const f=format||((n:number)=>n.toLocaleString('tr-TR'));return <span className="count"><i aria-hidden="true">{f(value)}</i><b>{f(v)}</b></span>}
// İskelet yükleme: metin satırı yerine yerini tutan, yumuşak parıldayan çubuklar
export function SkelRows({rows=3}:{rows?:number}){return <div className="skel-list" role="status" aria-label="Yükleniyor">{Array.from({length:rows},(_,i)=><span className="skel" key={i} style={{width:`${92-i*14}%`}}/>)}</div>}
