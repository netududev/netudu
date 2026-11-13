"use client";
import {useState} from 'react';
import {Check,LoaderCircle,RefreshCw} from '@/components/icons';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {subjects} from '@/lib/study';
import {ALL_DAYS,type DayKey} from '@/lib/plan/scheduler';
import {DEFAULT_MIN,LIMITS,parsePlaylistUrl,type PlaylistItem,type Resource,type ResourceKind,type ResourceUnit} from '@/lib/plan/resources';
import {useStudy,postJson} from '../shared';
import {DayPills} from './wizard';

const DEFAULT_PER_DAY:Record<ResourceUnit,string>={test:'2',sayfa:'20',video:'2'};
const whole=(v:string,lo:number,hi:number)=>v.trim()!==''&&/^\d+$/.test(v.trim())&&Number(v)>=lo&&Number(v)<=hi;

// Ekle / düzenle: tek dialog, tür seçimli. Alanlar sunucuda da doğrulanır; burada kısa, net hata metni gösterilir.
export function ResourceDialog({kind:kind0,edit,onClose}:{kind:ResourceKind;edit:Resource|null;onClose:()=>void}){const s=useStudy();
 const u0:ResourceUnit=edit?.unit||(kind0==='playlist'?'video':'test');
 const [kind,setKind]=useState<ResourceKind>(edit?.kind||kind0);const [name,setName]=useState(edit?.name||'');const [subject,setSubject]=useState(edit?.subject||'');
 const [unit,setUnit]=useState<ResourceUnit>(u0);const [total,setTotal]=useState(edit?String(edit.total):'');const [done,setDone]=useState('0');
 const [perDay,setPerDay]=useState(edit?String(edit.perDay):DEFAULT_PER_DAY[u0]);const [minutes,setMinutes]=useState(edit?String(edit.minPerUnit):String(DEFAULT_MIN[u0]));
 const [days,setDays]=useState<DayKey[]>(edit?.days||[...ALL_DAYS]);const [url,setUrl]=useState('');const [items,setItems]=useState<PlaylistItem[]>([]);const [note,setNote]=useState('');
 const [error,setError]=useState('');const [busy,setBusy]=useState(false);const [fetching,setFetching]=useState(false);const [touched,setTouched]=useState({perDay:!!edit,minutes:!!edit});
 const effUnit:ResourceUnit=kind==='playlist'?'video':unit;
 // Tür/birim değişince dokunulmamış varsayılanlar yenilenir
 const pick=(k:ResourceKind,u:ResourceUnit)=>{setKind(k);setUnit(u);if(!touched.perDay)setPerDay(DEFAULT_PER_DAY[u]);if(!touched.minutes)setMinutes(String(DEFAULT_MIN[u]));setError('')};
 const check=():string=>{if(!name.trim())return 'Kaynağa bir ad ver. Örneğin “345 TYT Matematik”.';
  if(!edit&&kind==='playlist'&&!parsePlaylistUrl(url))return 'Geçerli bir YouTube oynatma listesi bağlantısı yapıştır (youtube.com/playlist?list=…).';
  if(!whole(total,1,LIMITS.total))return `Toplam ${LIMITS.total} ile sınırlı; 1 ile ${LIMITS.total} arasında bir sayı gir.`;
  if(!edit&&!whole(done,0,Number(total)))return 'Tamamlanan sayı 0 ile toplam arasında olmalı.';
  if(!whole(perDay,1,LIMITS.perDay))return `Günlük hedef 1 ile ${LIMITS.perDay} arasında olmalı.`;
  if(!whole(minutes,1,LIMITS.minPerUnit))return `Süre 1 ile ${LIMITS.minPerUnit} dakika arasında olmalı.`;
  if(!days.length)return 'En az bir çalışma günü seç.';return ''};
 async function load(){if(!parsePlaylistUrl(url)){setError('Önce geçerli bir oynatma listesi bağlantısı yapıştır.');return}setError('');setFetching(true);setNote('');
  try{const d=await postJson('/api/plan/resources',{action:'fetch-playlist',url});const pl=d.playlist!;setItems(pl.items);setTotal(String(pl.total));setNote(`${pl.total} video bulundu${pl.total>pl.items.length?`; ilk ${pl.items.length} videonun başlığı kaydedilir`:''}.`)}
  catch(e){setItems([]);setNote('');setError((e as Error).message)}finally{setFetching(false)}}
 async function save(){const msg=check();if(msg){setError(msg);return}setError('');setBusy(true);
  const common={name:name.trim(),subject,total:Number(total),perDay:Number(perDay),minPerUnit:Number(minutes),days};
  const ok=edit?await s.resourceOp({action:'update',id:edit.id,fields:{...common,...(kind==='book'?{unit}:{})}},'Kaynak güncellendi.')
   :await s.resourceOp({action:'add',resource:kind==='book'?{kind,unit,done:Number(done),...common}:{kind,url:url.trim(),items,done:Number(done),...common}},'Kaynak eklendi.');
  setBusy(false);if(ok)onClose()}
 const uw=effUnit==='test'?'test':effUnit==='sayfa'?'sayfa':'video';
 return <Dialog open onOpenChange={v=>{if(!v&&!busy)onClose()}}><DialogContent className="question-dialog res-dialog"><DialogHeader><DialogTitle>{edit?'Kaynağı düzenle':'Kaynak ekle'}</DialogTitle><DialogDescription>{kind==='book'?'Soru bankası ya da kitap: günlük hedefin programındaki boş saatlere yerleşir.':'YouTube oynatma listesi: hangi videoda kaldığını saklarız.'}</DialogDescription></DialogHeader>
  <form className="res-form" noValidate onSubmit={e=>{e.preventDefault();void save()}}>
   {!edit&&<div className="segmented full" role="group" aria-label="Kaynak türü"><button type="button" className={kind==='book'?'on':''} aria-pressed={kind==='book'} onClick={()=>pick('book',unit==='video'?'test':unit)}>Soru bankası / kitap</button><button type="button" className={kind==='playlist'?'on':''} aria-pressed={kind==='playlist'} onClick={()=>pick('playlist','video')}>Oynatma listesi</button></div>}
   {!edit&&kind==='playlist'&&<div className="res-url"><label>Oynatma listesi bağlantısı<input type="url" inputMode="url" autoComplete="off" placeholder="https://www.youtube.com/playlist?list=…" value={url} onChange={e=>{setUrl(e.target.value);setItems([]);setNote('')}}/></label>
    {s.youtube?<button type="button" className="secondary" disabled={fetching||!url.trim()} onClick={()=>void load()}>{fetching?<LoaderCircle className="spin" size={16}/>:<RefreshCw size={16}/>} Listeyi getir</button>:null}
    <small className="muted">{note||(s.youtube?'Listeyi getirirsen video sayısı ve başlıklar otomatik dolar. Getiremezsen sayıyı elle girebilirsin.':'Video sayısını elle gir. Başlıklar olmadan “n. video” olarak gösterilir.')}</small></div>}
   <div className="form-grid">
    <label>Ad<input maxLength={LIMITS.name} placeholder={kind==='book'?'345 TYT Matematik':'Matematik kampı'} value={name} onChange={e=>setName(e.target.value)} autoFocus/></label>
    <label>Ders <small>isteğe bağlı</small><select className="choice-native" value={subject} onChange={e=>setSubject(e.target.value)}><option value="">Ders seçme</option>{subjects.map(x=><option key={x} value={x}>{x}</option>)}</select></label>
    {kind==='book'&&<div className="field-label">Birim<div className="segmented full" role="group" aria-label="Birim"><button type="button" className={unit==='test'?'on':''} aria-pressed={unit==='test'} onClick={()=>pick('book','test')}>Test</button><button type="button" className={unit==='sayfa'?'on':''} aria-pressed={unit==='sayfa'} onClick={()=>pick('book','sayfa')}>Sayfa</button></div></div>}
    <label>Toplam {uw} sayısı<input type="number" inputMode="numeric" min={1} max={LIMITS.total} value={total} onChange={e=>setTotal(e.target.value)}/></label>
    {!edit&&<label>Şu ana kadar tamamlanan <small>başlangıç noktası</small><input type="number" inputMode="numeric" min={0} max={Number(total)||LIMITS.total} value={done} onChange={e=>setDone(e.target.value)}/></label>}
    <label>Günlük hedef <small>{uw}</small><input type="number" inputMode="numeric" min={1} max={LIMITS.perDay} value={perDay} onChange={e=>{setPerDay(e.target.value);setTouched(t=>({...t,perDay:true}))}}/></label>
    <label>Birim başına tahmini dakika<input type="number" inputMode="numeric" min={1} max={LIMITS.minPerUnit} value={minutes} onChange={e=>{setMinutes(e.target.value);setTouched(t=>({...t,minutes:true}))}}/></label>
   </div>
   <div className="field-label">Çalışılacak günler<DayPills value={days} onChange={setDays}/></div>
   {error&&<p className="form-error" role="alert">{error}</p>}
   <div className="wizard-nav"><button type="button" className="secondary" disabled={busy} onClick={onClose}>Vazgeç</button><button type="submit" className="primary" disabled={busy}>{busy?<LoaderCircle className="spin" size={16}/>:<Check size={16}/>} {edit?'Kaydet':'Ekle'}</button></div>
  </form></DialogContent></Dialog>}
