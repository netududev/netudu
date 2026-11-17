// Kaydır Çöz önizlemesi (sunucu çizimi): başlangıç, boş durum, soru / çözüm / bitiş kartları. Veriler ÖRNEKTİR. Kalıp: rapor-entry.tsx.
import * as React from 'react';
import {renderToStaticMarkup as R} from 'react-dom/server';
import {SwipeView} from '@/app/study/swipe/swipe-view';
import {Feed} from '@/app/study/swipe/feed';
import {startSession} from '@/lib/swipe/queue';
import {today} from '@/lib/study';
import {shell} from './shell-entry';
import {sampleRows} from './kaydir-data';
export * from './shell-entry';
export {sampleRows};

const day=today();
const map=(rows=sampleRows)=>new Map(rows.map(q=>[q.id,q]));
const mkW=(session:any,extra:any={})=>({session,saved:null,rows:map(),picks:{},learned:new Set(),live:'',setLive(){},online:true,failed:0,start(){return true},resume(){},exit(){},next(){},mark(){},pick(){},markLearned:async()=>{},continueEarly(){},restartWithLearned(){},retryStruggled(){},earlyCount:()=>0,learnedCount:()=>0,...extra});
// Oturum: ids sırasıyla (pickNext karıştırması yerine sabit sıra) ilk kart güncel
const session=(ids:string[],o:any={})=>{const s0=startSession(sampleRows,day,{subject:'Tüm dersler',scope:'due',includeLearned:false});
  const base={...s0,queue:ids.slice(1),current:ids[0],history:[ids[0]],tiers:{...s0.tiers,...Object.fromEntries(ids.map(i=>[i,s0.tiers[i]??'A']))},...o};return base;};
const frame=(body:React.ReactNode,rows=sampleRows)=>shell('swipe',{body,study:{rows}});
export const baslangic=(o:any={})=>frame(<SwipeView/>,o.rows);
export const bos=()=>frame(<SwipeView/>,[]);
export const bitis=(o:any={})=>{let s:any=session(['q0','q1','q2']);s={...s,current:null,queue:[],history:['q0','q1','q2'],results:{q0:{first:'bildim',wrong:0,skips:0},q1:{first:'bilemedim',wrong:1,skips:0},q2:{first:null,wrong:0,skips:1}},struggle:o.hard?['q1']:[]};
  return frame(<Feed w={mkW(s,{earlyCount:()=>o.early??0})} onHome={()=>{}}/>)};
// Kart ekranı: ids ilk soru güncel; extra: mark / picks vb.
export const kart=(id:string,o:any={})=>{const ids=[id,...sampleRows.filter(q=>q.id!==id).map(q=>q.id).slice(0,2)];const s=session(ids,{mark:o.mark??null});
  return frame(<Feed w={mkW(s,{picks:o.pick?{0:o.pick}:{},online:o.online??true})} onHome={()=>{}}/>)};
