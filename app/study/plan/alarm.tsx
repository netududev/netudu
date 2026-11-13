"use client";
import {useCallback,useEffect,useRef,useState} from 'react';
import {Play,AlarmClockOff,BellRing,Clock} from '@/components/icons';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {buildDay,MOTIVATION,type DayItem} from '@/lib/plan/scheduler';
import {useStudy,readSetting,writeSetting} from '../shared';
import {localToday} from './ui';

type Ring={kind:'daily'|'block'|'test';item:DayItem|null};
let ctx:AudioContext|null=null;
function beep(freq:number,dur:number){try{ctx=ctx||new (window.AudioContext||(window as unknown as {webkitAudioContext:typeof AudioContext}).webkitAudioContext)();const o=ctx.createOscillator();const g=ctx.createGain();o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(0.0001,ctx.currentTime);g.gain.exponentialRampToValueAtTime(0.25,ctx.currentTime+0.02);g.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+dur);o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+dur+0.05)}catch{}}
export async function askNotificationPermission(){if(typeof Notification==='undefined')return 'unsupported';if(Notification.permission==='default')return Notification.requestPermission();return Notification.permission}
export const testAlarm=()=>window.dispatchEvent(new Event('nd:test-alarm'));

// Uygulama açıkken çalışan alarm: günlük alarm saati ve (isteğe bağlı) her çalışma bloğunun başlangıcı
export function AlarmCenter(){const s=useStudy();const plan=s.plan;const [ring,setRing]=useState<Ring|null>(null);const loop=useRef<ReturnType<typeof setInterval>|null>(null);const stopAt=useRef<ReturnType<typeof setTimeout>|null>(null);const quote=useRef(0);
 const stop=useCallback(()=>{if(loop.current)clearInterval(loop.current);if(stopAt.current)clearTimeout(stopAt.current);loop.current=null},[]);
 const fire=useCallback((r:Ring)=>{quote.current=Math.floor(Math.random()*MOTIVATION.length);setRing(r);stop();beep(784,0.18);loop.current=setInterval(()=>{beep(784,0.18);setTimeout(()=>beep(988,0.22),220)},1500);stopAt.current=setTimeout(stop,60000);
  try{if(typeof Notification!=='undefined'&&Notification.permission==='granted'&&document.hidden){const d=plan?buildDay(plan,localToday(),localToday()):null;new Notification(r.kind==='block'&&r.item?`Çalışma zamanı: ${r.item.start}`:'netudu · Ders zamanı',{body:r.item?.title||(d?.lesson?`${d.lesson.subj}: ${d.lesson.topic}`:'Bugünün programına bak.'),icon:'/icon-192.png',tag:'nd-alarm'})}}catch{}},[plan,stop]);
 useEffect(()=>{const t=()=>fire({kind:'test',item:null});window.addEventListener('nd:test-alarm',t);return()=>window.removeEventListener('nd:test-alarm',t)},[fire]);
 useEffect(()=>{if(!plan)return;const check=()=>{const cfg=plan.config.alarm;const n=new Date();const hm=`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`;const date=localToday();
   const once=(key:string,r:Ring)=>{const k=`alarm:${date}:${key}`;if(readSetting(k,'')==='1')return;writeSetting(k,'1');fire(r)};
   if(cfg.enabled&&hm===cfg.time)once('daily-'+cfg.time,{kind:'daily',item:null});
   if(cfg.blockReminders){const day=buildDay(plan,date,date);const it=day.items.find(i=>(i.type==='study'||i.type==='resource')&&i.start===hm);if(it)once('block-'+it.start,{kind:'block',item:it})}};
  check();const id=setInterval(check,15000);return()=>clearInterval(id)},[plan,fire]);
 useEffect(()=>stop,[stop]);
 const day=plan?buildDay(plan,localToday(),localToday()):null;const lesson=day?.lesson;
 function close(){stop();setRing(null)}
 function snooze(){close();setTimeout(()=>fire({kind:ring?.kind||'daily',item:ring?.item||null}),5*60000)}
 return <Dialog open={!!ring} onOpenChange={v=>{if(!v)close()}}><DialogContent className="upload-dialog alarm-dialog"><DialogHeader><DialogTitle><BellRing size={20}/> {ring?.kind==='block'&&ring.item?`${ring.item.start} · çalışma bloğu başlıyor`:'Ders zamanı'}</DialogTitle><DialogDescription>{ring?.item?ring.item.title:lesson?`${lesson.subj} · ${lesson.target}`:day?.isOff?'Bugün dinlenme günün.':'Bugünün programına bak.'}</DialogDescription></DialogHeader>
  <div className="alarm-body"><span className="alarm-ring"><Clock size={34}/></span>{lesson&&<h3>{lesson.topic}</h3>}<p className="alarm-quote">“{MOTIVATION[quote.current]}”</p></div>
  <div className="actions wrap">{lesson&&<button className="primary" onClick={()=>{close();s.openLessonVideo(lesson)}}><Play size={16}/> Derse başla</button>}<button className="secondary" onClick={snooze}>5 dk ertele</button><button className="text-button" onClick={close}><AlarmClockOff size={15}/> Kapat</button></div></DialogContent></Dialog>}
