"use client";
import {useCallback,useEffect,useMemo,useState} from 'react';
import {toast} from 'sonner';
import {CalendarClock,Flame,Sparkles,ArrowUpRight,Check,Clock,Target,LoaderCircle,AlertTriangle,Bell} from 'lucide-react';
import {planStats,MOTIVATION,daysBetween} from '@/lib/plan/scheduler';
import {studyStreak} from '@/lib/plan/streak';
import {dueQuestions,daysUntil,monthlyTopics,today,prevMonth} from '@/lib/study';
import {useStudy,Empty,monthLabel,postJson,readSetting,writeSetting} from '../shared';
import {DueList} from '../home';
import {Timeline,Warnings,LessonActions,LessonHead,PlanStart,DoneMark,dayFor,nextBlock,minutesUntil,longDate,localToday} from './ui';

// Günün ilerlemesi halkası: değer 0-100, gerçek veriden gelir
function Ring({value,label,sub}:{value:number;label:string;sub:string}){
 return <div className="ring" role="img" aria-label={`${label}: %${value}, ${sub}`}><svg viewBox="0 0 120 120" aria-hidden="true"><g transform="rotate(-90 60 60)"><circle className="ring-track" cx="60" cy="60" r="52"/><circle className="ring-arc" cx="60" cy="60" r="52" pathLength="100" opacity={value?1:0} style={{'--v':value} as React.CSSProperties}/></g></svg><div><strong>%{value}</strong><small>{label}</small></div></div>
}

// "Bugün" sayfası: tek odak = sıradaki iş; günün ilerlemesi, tamamlanma anı ve tekrar sırası
export function TodayView(){const s=useStudy();const {plan,rows,loading,ai}=s;const [tick,setTick]=useState(0);const quoteKey='quote:'+(s.user?.email||'')+':'+localToday();const [quote,setQuote]=useState(()=>readSetting(quoteKey,'')||MOTIVATION[Math.floor(Math.random()*MOTIVATION.length)]);const [quoteBusy,setQuoteBusy]=useState(false);
 useEffect(()=>{const t=setInterval(()=>setTick(x=>x+1),30000);return()=>clearInterval(t)},[]);
 // Günün teşviki: yapay zekâ açıksa yeni ve öğrenciye özel bir cümle üretir; kapalıysa ya da hak bittiyse hazır listeden seçer
 const examDays=daysUntil(s.profile.examDate);const focusTopic=monthlyTopics(rows,today().slice(0,7))[0];
 const focusText=focusTopic?`${focusTopic.subject} · ${focusTopic.topic}`:undefined;const quoteBody=useMemo(()=>({examDays:examDays>0?examDays:undefined,focus:focusText,previous:[quote]}),[examDays,focusText,quote]);
 const freshQuote=useCallback(async(manual:boolean)=>{const fallback=()=>MOTIVATION[Math.floor(Math.random()*MOTIVATION.length)];if(!ai){setQuote(fallback());return}if(manual)setQuoteBusy(true);try{const d=await postJson('/api/quote',quoteBody) as unknown as {quote:string};setQuote(d.quote);writeSetting(quoteKey,d.quote)}catch(e){if(manual)toast.error((e as Error).message);setQuote(fallback())}finally{setQuoteBusy(false)}},[ai,quoteBody,quoteKey]);
 useEffect(()=>{if(!ai||readSetting(quoteKey,''))return;let live=true;postJson('/api/quote',quoteBody).then(r=>{const d=r as unknown as {quote:string};if(live){setQuote(d.quote);writeSetting(quoteKey,d.quote)}}).catch(()=>{});return()=>{live=false}},[ai,quoteKey]); // eslint-disable-line react-hooks/exhaustive-deps
 const date=localToday();const day=useMemo(()=>plan?dayFor(plan,date):null,[plan,date,tick]);const stats=plan?planStats(plan,date):null;
 const due=dueQuestions(rows);const month=today().slice(0,7);const lastCount=rows.filter(q=>q.date.startsWith(prevMonth(month))).length;const focus=monthlyTopics(rows,month)[0];
 const next=day?nextBlock(day):null;const first=s.profile.name.split(' ')[0];const hour=new Date().getHours();const hello=hour<12?'Günaydın':hour<18?'İyi çalışmalar':'İyi akşamlar';
 // Programın ilk kez oluştuğu an (sihirbaz işareti bırakır): bir kez kutlanır
 const celebKey='plan-created:'+(s.user?.email||'');const [fresh,setFresh]=useState(false);
 useEffect(()=>{if(plan&&readSetting(celebKey,'')==='1'){writeSetting(celebKey,'');setFresh(true)}},[plan,celebKey]);
 // Günün ilerlemesi: ders (varsa) + bugün sırası gelen tekrarlar; gün içinde görülen en yüksek tekrar sayısı o günün toplamı sayılır
 const dueKey='due-max:'+(s.user?.email||'')+':'+date;const [dueMax,setDueMax]=useState(0);
 useEffect(()=>{if(loading)return;const m=Math.max(Number(readSetting(dueKey,'0'))||0,due.length);writeSetting(dueKey,String(m));setDueMax(m)},[loading,due.length,dueKey]);
 const dueTotal=Math.max(dueMax,due.length);const lessonDone=!!(day?.lesson&&plan?.done[String(day.lesson.index)]);
 const dayTotal=(day?.lesson?1:0)+dueTotal;const dayDone=(lessonDone?1:0)+(dueTotal-due.length);const dayPct=dayTotal?Math.round(dayDone/dayTotal*100):0;const allDone=dayTotal>0&&dayDone===dayTotal;
 const streak=plan?studyStreak(plan.done,date):0;
 const sub=plan&&day?day.isOff?'Bugün dinlenme günün; dersin yarına kaydı.':day.lesson?(lessonDone?'Bugünün işi tamam. Yarın kaldığın yerden devam edersin.':'Bugünün işi bu. Tamamlayınca ilerlemene eklenir.'):stats?.started===false?`Programın ${longDate(plan.config.startDate)} günü başlıyor.`:'Serbest tekrar günü.':'';
 const dueSection=<article className="archive-preview flush"><div className="section-heading"><div><h2>Bugünün yanlış tekrarları</h2><p className="muted">Aralıklı tekrar: 1 → 3 → 7 → 14 → 30 → 60 gün.</p></div></div>{loading?<p className="loading"><LoaderCircle className="spin" size={20}/> Yükleniyor…</p>:due.length?<DueList items={due.slice(0,6)}/>:<Empty title="Bugün tekrar edilecek yanlış yok." icon={<Check/>}>{rows.length?'Sırası gelen sorular burada listelenir.':'Denemeden sonra yanlışlarını ekle; tekrar takvimin burada oluşur.'}</Empty>}{due.length>6&&<p className="footnote">+{due.length-6} soru daha · <button className="text-button" onClick={()=>s.setView('archive')}>arşivde gör</button></p>}</article>;
 return <>
  {!ai&&rows.length>0&&<div className="notice-strip warn"><AlertTriangle size={19}/><div><strong>Yapay zekâ çözümü şu an kapalı.</strong> Yanlışların arşive kaydedilir; çözüm açıldığında tek tıkla hazırlanır.</div></div>}
  {Number(today().slice(8,10))<=10&&lastCount>0&&<div className="notice-strip"><Bell size={19}/><div><strong>{monthLabel(prevMonth(month))} raporun hazır.</strong> Geçen ay {lastCount} yanlış ekledin.</div><button className="text-button" onClick={()=>s.setView('report')}>Raporu aç <ArrowUpRight size={15}/></button></div>}
  {fresh&&<div className="td-welcome" role="status"><DoneMark/><div><strong>Programın hazır.</strong><span>İlk işin aşağıda. Tamamladıkça ilerlemen burada dolar.</span></div><button className="text-button" onClick={()=>setFresh(false)}>Tamam</button></div>}
  {!plan?<>
   <header className="td-head"><span className="eyebrow">{longDate(date).toLocaleUpperCase('tr')}</span><h1 className="td-title">{hello}{first?`, ${first}`:''}.</h1></header>
   <PlanStart/>
  </>
  :day&&<section className={'td-focus'+(allDone?' is-done':'')}>
   <div className="td-main">
    <span className="eyebrow">{longDate(date).toLocaleUpperCase('tr')}</span><h1 className="td-title">{hello}{first?`, ${first}`:''}.</h1><p className="td-sub">{sub}</p>
    <div className="td-lesson"><LessonHead day={day}/>{lessonDone&&<p className="td-done"><DoneMark/> Bugünün dersi tamam.</p>}<LessonActions day={day}/><Warnings day={day}/></div>
   </div>
   <aside className="td-side" aria-label="Günün ilerlemesi">
    {dayTotal>0?<Ring value={dayPct} label="Bugün" sub={`${dayDone}/${dayTotal} iş`}/>:stats&&<Ring value={stats.percent} label="Program" sub={`${stats.done}/${stats.total} ders`}/>}
    <ul className="td-facts">
     {stats&&<li><Target size={16}/> Program <b>%{stats.percent}</b> · {stats.done}/{stats.total} ders</li>}
     {streak>=2&&<li><Flame size={16}/> <b>{streak}</b> gün üst üste çalıştın</li>}
     <li><CalendarClock size={16}/> {examDays>0?<><b>{examDays}</b> gün · YKS {s.profile.examYear}</>:'Sınav tarihini güncelle'}</li>
     {next&&<li><Clock size={16}/> {minutesUntil(next.start)<=60?`${minutesUntil(next.start)} dk sonra`:next.start}: {next.title.split(':')[0]}</li>}
    </ul>
   </aside>
  </section>}
  {plan&&day&&<section className="td-flow"><article className="panel"><div className="section-heading"><div><span className="eyebrow">BİRLEŞİK SAATLİK PLAN</span><h2>Bugünün akışı</h2></div><button className="text-button" onClick={()=>s.setView('program')}>Haftalık program <ArrowUpRight size={15}/></button></div><Timeline day={day} live/></article></section>}
  {(plan||rows.length>0)&&<section className="dashboard-grid">
   {dueSection}
   <article className="focus-card"><span className="eyebrow">GÜNÜN TEŞVİKİ</span><h2 key={quote} className="quote-in">“{quote}”</h2><p>{focus?`Bu ay en çok ${focus.subject} · ${focus.topic} konusunda zorlandın (${focus.count} yanlış).`:'Denemeden sonra yanlışlarını ekle; en çok zorlandığın konuyu burada göstereyim.'}</p><div className="focus-actions"><button onClick={()=>void freshQuote(true)} disabled={quoteBusy}>{quoteBusy?<LoaderCircle className="spin" size={16}/>:<Sparkles size={16}/>} Yeni teşvik</button><button onClick={()=>s.setView('report')}><Target size={16}/> Aylık rapor</button></div></article>
  </section>}
  {plan&&stats&&!stats.started&&<p className="footnote">Program {daysBetween(date,plan.config.startDate)} gün sonra başlıyor.</p>}
 </>}
