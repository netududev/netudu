"use client";
import {useMemo,useState} from 'react';
import {Plus,Trash2,Check,Undo2,Minus,ExternalLink,Play,BookOpen,List,CalendarClock,Wand2,Flag,ArrowUpRight,Target} from '@/components/icons';
import {AlertDialog,AlertDialogContent,AlertDialogHeader,AlertDialogTitle,AlertDialogDescription,AlertDialogFooter,AlertDialogCancel,AlertDialogAction} from '@/components/ui/alert-dialog';
import {daysBetween,type DayPlan} from '@/lib/plan/scheduler';
import {UNIT_TITLE,continueUrl,doneCount,finishEstimate,isFinished,isUnitDone,percentOf,resourceTasksForDay,resumeIndex,spanLabel,titleOf,unitsFor,upcoming,type ProgressOp,type Resource,type ResourceKind} from '@/lib/plan/resources';
import {useStudy,Empty,StatStrip} from '../shared';
import {shortDate,localToday,DoneMark} from './ui';
import {ResourceDialog} from './resource-dialog';

const unitWord=(r:Resource)=>UNIT_TITLE[r.unit].toLocaleLowerCase('tr');
const WEEKDAYS=['Pzt','Sal','Çar','Per','Cum'].join(),WEEKEND=['Cmt','Paz'].join();
export const daysLabel=(d:string[])=>d.length===7?'Her gün':d.join()===WEEKDAYS?'Hafta içi':d.join()===WEEKEND?'Hafta sonu':d.join(', ');
export const minutesLabel=(m:number)=>m>=60?`${Math.floor(m/60)} sa${m%60?` ${m%60} dk`:''}`:`${m} dk`;

// Kaynak kartı: ilerleme, sıradaki iş / kaldığın yer, bugünkünü bitir, düzeltme, konum, düzenle, sil
function ResourceCard({r,today,onEdit}:{r:Resource;today:string;onEdit:(r:Resource)=>void}){const s=useStudy();const [pos,setPos]=useState(false);const [posVal,setPosVal]=useState('');const [del,setDel]=useState(false);
 const done=doneCount(r),pct=percentOf(r),fin=isFinished(r),resume=resumeIndex(r),todayU=unitsFor(r,today,today),est=finishEstimate(r,today);const isList=r.kind==='playlist';
 const op=(o:ProgressOp)=>s.resourceOp({action:'progress',id:r.id,op:o,today});
 const posN=Math.min(r.total,Math.max(1,Math.trunc(Number(posVal))||1));
 const link=isList&&resume?continueUrl(r,resume):'';
 return <article className={'res-card'+(fin?' fin':'')} aria-label={r.name}>
  <header className="rc-top"><span className="rc-ico" aria-hidden="true">{isList?<Play size={20}/>:<BookOpen size={20}/>}</span><div className="rc-title"><h3>{r.name}</h3><small>{[r.subject,`Günde ${r.perDay} ${unitWord(r)}`,daysLabel(r.days)].filter(Boolean).join(' · ')}</small></div>{fin&&<span className="status good"><Check size={13} aria-hidden="true"/> Bitti</span>}</header>
  <div className="rc-progress"><div><b>{done}/{r.total}</b> {unitWord(r)} <span className="muted">· %{pct}</span></div><i className="bar" role="progressbar" aria-label={`${r.name} ilerlemesi`} aria-valuemin={0} aria-valuemax={r.total} aria-valuenow={done}><b style={{width:pct+'%'}}/></i></div>
  {fin?<p className="rc-next"><Flag size={15} aria-hidden="true"/> Hepsi tamam. Tebrikler.</p>
   :isList?<p className="rc-next"><Target size={15} aria-hidden="true"/> <span><b>Kaldığın yer:</b> {resume}. video{titleOf(r,resume!)?` — ${titleOf(r,resume!)}`:''}</span></p>
   :<p className="rc-next"><Target size={15} aria-hidden="true"/> <span><b>Sıradaki:</b> {spanLabel(r,upcoming(r))}</span></p>}
  <p className="rc-meta">{todayU?<>Bugün: {spanLabel(r,todayU.units)}{todayU.done?' · tamam':''}</>:fin?'':'Bugün seçili gün değil'}{est.date&&<> · Tahmini bitiş: <b>{shortDate(est.date)}</b> ({daysBetween(today,est.date)<=0?'bugün':`${daysBetween(today,est.date)} gün sonra`})</>}{!est.date&&!fin&&' · Tahmini bitiş yok'}</p>
  {!fin&&<div className="rc-actions">
   {todayU?.done?<button className="secondary" onClick={()=>void s.resourceOp({action:'undo-today',id:r.id,today},'Geri alındı.')}><Undo2 size={16}/> Geri al</button>
    :<button className="primary" onClick={()=>void s.resourceOp({action:'complete-today',id:r.id,today},'Tamamlandı. Eline sağlık.')}><Check size={16}/> {todayU?'Bugünkünü bitirdim':'Sıradakini bitirdim'}</button>}
   {link&&<a className="secondary" href={link} target="_blank" rel="noopener noreferrer"><ExternalLink size={16}/> YouTube'da devam et</a>}
  </div>}
  <div className="rc-tools">
   <div className="res-step" role="group" aria-label={`${r.name}: ilerlemeyi düzelt`}><button type="button" className="icon-button" aria-label={`Bir ${unitWord(r)} geri al`} disabled={done<=0} onClick={()=>void op({mode:'delta',delta:-1})}><Minus size={16}/></button><output aria-live="polite">{done}/{r.total}</output><button type="button" className="icon-button" aria-label={`Bir ${unitWord(r)} ekle`} disabled={fin} onClick={()=>void op({mode:'delta',delta:1})}><Plus size={16}/></button></div>
   <button type="button" className="text-button" aria-expanded={pos} onClick={()=>{setPos(!pos);setPosVal(String(Math.min(r.total,done+1)))}}>Şu an buradayım</button>
   <button type="button" className="text-button" onClick={()=>onEdit(r)}>Düzenle</button>
   <button type="button" className="icon-button" aria-label={`${r.name} kaynağını sil`} onClick={()=>setDel(true)}><Trash2 size={16}/></button>
  </div>
  {pos&&<form className="res-pos" onSubmit={e=>{e.preventDefault();void op({mode:'set',position:posN-1}).then(()=>setPos(false))}}><label>Şu anki {unitWord(r)} numaran<input type="number" inputMode="numeric" min={1} max={r.total} value={posVal} onChange={e=>setPosVal(e.target.value)}/></label><button type="submit" className="secondary"><Check size={15}/> Konumu kaydet</button><small>Bundan önceki {posN-1} {unitWord(r)} tamamlandı sayılır.</small></form>}
  {isList&&<details className="res-videos"><summary>Videolar ({r.total})</summary><ol>{Array.from({length:r.total},(_,k)=>k+1).map(i=>{const w=isUnitDone(r,i);const t=titleOf(r,i);return <li key={i} className={(w?'on ':'')+(i===resume?'here':'')}><label><input type="checkbox" checked={w} onChange={()=>void op({mode:'toggle',index:i})} aria-label={`${i}. video izlendi`}/><span className="rv-n">{i}.</span><span className="rv-t">{t||`${i}. video`}{i===resume&&<span className="status good">Kaldığın yer</span>}</span></label>{r.listId&&<a className="icon-button" aria-label={`${i}. videoyu YouTube'da aç`} href={continueUrl(r,i)} target="_blank" rel="noopener noreferrer"><ExternalLink size={15}/></a>}</li>})}</ol></details>}
  <AlertDialog open={del} onOpenChange={setDel}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>“{r.name}” silinsin mi?</AlertDialogTitle><AlertDialogDescription>Kaynak ve ilerlemen silinir; programındaki blokları kalkar. Bu işlem geri alınamaz.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Vazgeç</AlertDialogCancel><AlertDialogAction onClick={()=>void s.resourceOp({action:'remove',id:r.id},'Kaynak silindi.')}>Sil</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
 </article>}

function Section({title,hint,kind,list,today,onAdd,onEdit}:{title:string;hint:string;kind:ResourceKind;list:Resource[];today:string;onAdd:(k:ResourceKind)=>void;onEdit:(r:Resource)=>void}){
 return <section className="res-section" aria-label={title}><div className="section-heading"><div><h2>{title}</h2><p className="muted">{hint}</p></div><button className="secondary" onClick={()=>onAdd(kind)}><Plus size={16}/> Ekle</button></div>
  {list.length?<div className="res-grid">{list.map(r=><ResourceCard key={r.id} r={r} today={today} onEdit={onEdit}/>)}</div>
   :<p className="res-none">{kind==='book'?'Henüz soru bankası ya da kitap eklemedin.':'Henüz oynatma listesi eklemedin.'}</p>}</section>}

// Kaynaklar sayfası: özet şeridi + iki bölüm (soru bankaları, oynatma listeleri)
export function ResourcesView(){const s=useStudy();const plan=s.plan;const today=localToday();const [dlg,setDlg]=useState<{kind:ResourceKind;edit:Resource|null;n:number}|null>(null);
 const list=plan?.config.resources||[];const tasks=useMemo(()=>resourceTasksForDay(list,today,today),[list,today]);
 if(!plan)return <Empty title="Önce programını kur." icon={<CalendarClock/>} action={<button className="primary" onClick={s.openWizard}><Wand2 size={18}/> Programı oluştur</button>} steps={['Okul ve sabit saatlerini gir.','Programın hazır olunca kaynak ekle.','Kaynakların günlük payı boş saatlerine yerleşir.']}>Kaynaklar, okul ve sabit saatlerinle çakışmadan programına yerleşir. Bunun için önce bir programın olmalı.</Empty>;
 const active=list.filter(r=>!isFinished(r)).length,minutes=tasks.reduce((a,t)=>a+t.minutes,0);
 const open=(kind:ResourceKind,edit:Resource|null=null)=>setDlg({kind,edit,n:Date.now()});
 return <>
  <StatStrip items={[{label:'Aktif kaynak',value:active,sub:`${list.length-active} bitti`},{label:'Bugünkü süre',value:minutesLabel(minutes),sub:tasks.length?`${tasks.length} kaynak görevi`:'Bugün kaynak işi yok'},{label:'Bugünkü iş',value:`${tasks.filter(t=>t.done).length}/${tasks.length}`,sub:'tamamlanan'}]}/>
  {!list.length&&<Empty title="Henüz kaynağın yok." icon={<List/>} action={<div className="actions wrap"><button className="primary" onClick={()=>open('book')}><Plus size={18}/> Soru bankası ekle</button><button className="secondary" onClick={()=>open('playlist')}><Plus size={16}/> Oynatma listesi ekle</button></div>} steps={['Adını, toplamını ve günlük hedefini gir.','Bugünün payı programındaki boş saatlere yerleşir.','Bitirince işaretle; kaldığın yer kaydedilir.']}>Soru bankanı, kitabını ya da bir YouTube oynatma listesini ekle. Nerede kaldığını burada görürsün.</Empty>}
  {list.length>0&&<><Section title="Soru bankaları" hint="Test ve sayfa bazlı kitaplar." kind="book" list={list.filter(r=>r.kind==='book')} today={today} onAdd={open} onEdit={r=>open(r.kind,r)}/>
  <Section title="Oynatma listeleri" hint="YouTube listeleri; hangi videoda kaldığın saklanır." kind="playlist" list={list.filter(r=>r.kind==='playlist')} today={today} onAdd={open} onEdit={r=>open(r.kind,r)}/></>}
  {dlg&&<ResourceDialog key={dlg.edit?.id||dlg.kind+dlg.n} kind={dlg.kind} edit={dlg.edit} onClose={()=>setDlg(null)}/>}
 </>}

// Bugün ekranı: günün kaynak görevleri ve "bitirdim" düğmeleri; kaynak yoksa ilk kaynağı eklemeye yönlendirir
export function TodayResources({day}:{day:DayPlan}){const s=useStudy();const date=localToday();const has=(s.plan?.config.resources.length||0)>0;
 return <article className="panel res-today"><div className="section-heading"><div><span className="eyebrow">KAYNAKLAR</span><h2>Bugünkü kaynakların</h2><p className="muted">Soru bankası ve oynatma listesi payların boş saatlerine yerleşir.</p></div><button className="text-button" onClick={()=>s.setView('resources')}>Tüm kaynaklar <ArrowUpRight size={15}/></button></div>
  {!has?<Empty title="Henüz kaynağın yok." icon={<List/>} action={<button className="primary" onClick={()=>s.setView('resources')}><Plus size={18}/> İlk kaynağını ekle</button>}>Soru bankanı ya da bir YouTube oynatma listesini ekle. Günlük payı programına yerleşir.</Empty>
  :day.resources.length?<ul className="res-tasks">{day.resources.map(t=><li key={t.id} className={'res-task'+(t.done?' done':'')}><span className="rt-ico" aria-hidden="true">{t.done?<DoneMark/>:t.kind==='book'?<BookOpen size={18}/>:<Play size={18}/>}</span><div className="rt-body"><strong>{t.name}</strong><small>{t.label} · ~{t.minutes} dk{t.start?` · ${t.start}-${t.end}`:''}{t.subject?` · ${t.subject}`:''}</small></div>
    {t.done?<button className="text-button" onClick={()=>void s.resourceOp({action:'undo-today',id:t.id,today:date},'Geri alındı.')}><Undo2 size={15}/> Geri al</button>:<button className="secondary" onClick={()=>void s.resourceOp({action:'complete-today',id:t.id,today:date},'Tamamlandı. Eline sağlık.')}><Check size={16}/> Bitirdim</button>}</li>)}</ul>
  :<p className="res-none">Bugün için kaynak işi yok. Kaynaklarının çalışma günlerini Kaynaklar sayfasından düzenleyebilirsin.</p>}</article>}
