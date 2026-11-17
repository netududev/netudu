// Kaydır Çöz tarayıcı paketi (klavye akışı sınaması): gerçek SwipeView + gerçek kanca, örnek veriyle; ağ çağrıları Playwright'ta taklit edilir. Veriler ÖRNEKTİR.
import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {StudyContext} from '@/app/study/shared';
import {SwipeView} from '@/app/study/swipe/swipe-view';
import {sampleRows} from './kaydir-data';

function App({rows0}:{rows0:any[]}){
  const [rows,setRows]=React.useState<any[]>(rows0);const log=React.useRef<any[]>([]);
  const study:any=React.useMemo(()=>({rows,exams:[],ai:true,usage:null,solving:new Set(),loading:false,user:{id:'u1',email:'ornek@example.com'},bumpUsage(){},setView(v:string){(window as any).__view=v},openUpload(){},select(q:any){(window as any).__selected=q?.id},solve:async()=>{},upsert:(q:any)=>setRows(o=>o.map(r=>r.id===q.id?q:r)),remove(){},setSubjectFilter(){}}),[rows]);void log;
  return <StudyContext.Provider value={study}><main className="workspace"><div className="view" data-view="swipe" data-width="wide"><SwipeView/></div></main></StudyContext.Provider>;
}
(window as any).__mount=(rows:any[]=sampleRows)=>{createRoot(document.getElementById('root')!).render(<App rows0={rows}/>)};
(window as any).__sample=sampleRows;
