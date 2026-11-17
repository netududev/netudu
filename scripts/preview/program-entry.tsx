// Bugün, Program, sihirbaz ve Kaynaklar önizlemeleri: gerçek bileşenlerin SSR çıktısı, örnek veriyle. Veriler ÖRNEKTİR.
import * as React from 'react';
import {renderToStaticMarkup as R} from 'react-dom/server';
import {StudyContext} from '@/app/study/shared';
import {PlanWizard} from '@/app/study/plan/wizard';
import {defaultPlanConfig,buildDay} from '@/lib/plan/scheduler';
import {localToday} from '@/app/study/plan/ui';
import type {Resource} from '@/lib/plan/resources';
import {shell,study,rows} from './shell-entry';
export * from './shell-entry';

const today=localToday();
const res=(o:Partial<Resource>&{id:string;kind:Resource['kind'];name:string;total:number;done:number}):Resource=>({subject:'Matematik',unit:o.kind==='playlist'?'video':'test',perDay:o.kind==='playlist'?2:3,minPerUnit:o.kind==='playlist'?40:25,days:['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'],...o} as Resource);
export const sampleResources:Resource[]=[
 res({id:'r1',kind:'playlist',name:'Matematik kampı',total:40,done:12,watched:Array.from({length:12},(_,i)=>i+1),listId:'PLabcdefghij1234',items:Array.from({length:40},(_,i)=>({id:'vid'+String(i).padStart(8,'0'),title:i===12?'Üslü sayılar 2':'Video '+(i+1)})) as any}),
 res({id:'r2',kind:'book',name:'345 TYT Matematik',total:60,done:18,unit:'test'}),
 res({id:'r3',kind:'book',name:'Paragraf soru bankası',subject:'Türkçe',total:120,done:40,unit:'sayfa',perDay:20,minPerUnit:6}),
 res({id:'r4',kind:'playlist',name:'Fizik konu anlatımı',subject:'Fizik',total:30,done:30,watched:Array.from({length:30},(_,i)=>i+1)}),
];
export const planWith=(o:{resources?:Resource[];doneToday?:boolean}={})=>{const cfg={...defaultPlanConfig(today,'12'),resources:o.resources||[]};const p:any={config:cfg,done:{},offDays:{}};
 if(o.doneToday){const l=buildDay(p,today,today).lesson;if(l)p.done[String(l.index)]=true}return p};
const st=(plan:any,more:any={})=>({...study,plan,...more});
export const bugun=(o:any={})=>shell('home',{withPlan:true,study:{plan:planWith(o),rows:o.rows??rows}});
export const bugunBos=()=>shell('home',{});
export const program=(o:any={})=>shell('program',{withPlan:true,study:{plan:planWith(o)}});
export const kaynaklar=(o:any={})=>shell('resources',{withPlan:true,study:{plan:planWith({resources:o.resources??sampleResources})}});
export const sihirbaz=(plan=false)=>R(<StudyContext.Provider value={st(plan?planWith():null)}><div className="dlg-frame"><PlanWizard open onClose={()=>{}}/></div></StudyContext.Provider>);
