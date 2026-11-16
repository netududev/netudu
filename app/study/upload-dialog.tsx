"use client";
import {useEffect,useRef,useState} from 'react';
import {Camera,Images,X,Sparkles} from '@/components/icons';
import {toast} from 'sonner';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {compressImage,validImage,maxUploadBytes} from '@/lib/image';
import {readClassification} from '@/lib/classify';
import type {Question} from '@/lib/study';
import {useStudy,api,QuotaNote,type UploadPreset} from './shared';
import {TagReview,type Item} from './tag-review';
// Yanlış ekle: 1) fotoğraf çek / galeriden seç, 2) yapay zekâ her soruyu tanır, öğrenci yalnız yanlışsa düzeltir.
// Deneme adı, tarih, sınav, ders, konu, soru metni ve cevap alanları yoktur; sunucu varsayılanlar ve /classify ile doldurur.
export const MAX_PER_BATCH=30;
const POOL=2;
const fmt=(b:number)=>b>1024*1024?(b/1024/1024).toFixed(1)+' MB':Math.round(b/1024)+' KB';
async function pool<T>(list:T[],n:number,fn:(x:T)=>Promise<void>){let i=0;await Promise.all(Array.from({length:Math.min(n,list.length)},async()=>{while(i<list.length){const x=list[i++];await fn(x)}}))}
export function UploadDialog({open,files,preset,onClose}:{open:boolean;files:File[];preset?:UploadPreset|null;onClose:()=>void}){
 const s=useStudy();const {ai}=s;
 const fileInput=useRef<HTMLInputElement>(null),cameraInput=useRef<HTMLInputElement>(null);
 const [items,setItems]=useState<Item[]>([]),[step,setStep]=useState<'pick'|'tag'>('pick'),[busy,setBusy]=useState(false);
 const hinted=!!(preset?.subject&&preset?.topic);
 useEffect(()=>{if(open){finished.current=false;setItems([]);setStep('pick');setBusy(false);addFiles(files)}
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[open]);
 useEffect(()=>{if(!open)setItems(cur=>{cur.forEach(i=>{if(i.preview)URL.revokeObjectURL(i.preview)});return []})},[open]);
 const live=useRef<Item[]>([]);live.current=items;
 useEffect(()=>()=>{live.current.forEach(i=>{if(i.preview)URL.revokeObjectURL(i.preview)})},[]);
 const finished=useRef(false);
 function addFiles(list:File[]){
  const ok=list.filter(f=>{if(!validImage(f)){toast.error(`${f.name||'Dosya'}: JPG, PNG veya WEBP olmalı.`);return false}return true});
  if(!ok.length)return;
  setItems(cur=>{const room=MAX_PER_BATCH-cur.length;if(ok.length>room)toast.message(`Bir seferde en fazla ${MAX_PER_BATCH} soru eklenir.`);return [...cur,...ok.slice(0,Math.max(room,0)).map(file=>({id:crypto.randomUUID(),file,preview:URL.createObjectURL(file),status:'bekliyor' as const}))]})}
 const patch=(id:string,p:Partial<Item>)=>setItems(cur=>cur.map(x=>x.id===id?{...x,...p}:x));
 async function run(it:Item){
  let q:Question|undefined=it.question;
  try{
   if(!q){
    patch(it.id,{status:'yükleniyor',message:''});
    const data=new FormData();data.set('id',it.id);
    if(preset?.subject){data.set('subject',preset.subject);if(preset.topic)data.set('topic',preset.topic);if(preset?.examType)data.set('examType',preset.examType);if(preset?.exam)data.set('exam',preset.exam)}
    const img=await compressImage(it.file);if(img.size>maxUploadBytes)throw new Error('Fotoğraf küçültülemedi; 8 MB altında bir fotoğraf dene.');
    data.set('image',img);
    const d=await api('/api/questions',{method:'POST',body:data});q=d.question;s.upsert(q);patch(it.id,{question:q})}
   if(!hinted&&readClassification(q.analysis)?.source==='none'){
    patch(it.id,{status:'tanınıyor',message:''});
    const d=await api(`/api/questions/${q.id}/classify`,{method:'POST'});q=d.question;s.upsert(q);if(d.status!=='skipped')s.bumpUsage('classify');patch(it.id,{question:q,message:d.status==='skipped'?d.reason:''})}
   patch(it.id,{status:readClassification(q.analysis)?.needsReview?'kontrol':'hazır'})
  }catch(err){patch(it.id,{status:'hata',message:(err as Error).message})}
 }
 async function start(){
  if(busy||!items.length)return;setStep('tag');setBusy(true);
  await pool(items,POOL,run);setBusy(false)}
 async function retry(it:Item){setBusy(true);await run(it);setBusy(false)}
 function finish(){
  if(finished.current)return;finished.current=true;
  const queue=items.map(i=>i.question).filter((q):q is Question=>!!q&&!q.analysis?.readable);
  const saved=items.filter(i=>i.question).length;
  if(saved)toast.success(saved===1?'Yanlış defterine eklendi.':`${saved} soru yanlış defterine eklendi.`);
  if(ai&&queue.length)void (async()=>{for(const q of queue)await s.solve(q)})();
  onClose()}
 return <Dialog open={open} onOpenChange={v=>{if(!busy&&!v){if(step==='tag')finish();else onClose()}}}><DialogContent className="upload-dialog cap-dialog">
  {step==='pick'?<>
   <DialogHeader><DialogTitle>Soruyu göster, gerisi bizde.</DialogTitle><DialogDescription>Ders ve konu yazmana gerek yok. Yapay zekâ her soruyu tanır, sen yalnız yanlışsa düzeltirsin.</DialogDescription></DialogHeader>
   <input ref={fileInput} type="file" multiple accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Galeriden soru fotoğrafları seç" tabIndex={-1} onChange={e=>{addFiles([...(e.target.files||[])]);e.target.value=''}}/>
   <input ref={cameraInput} type="file" accept="image/*" capture="environment" className="sr-only" aria-label="Kamerayla soru fotoğrafı çek" tabIndex={-1} onChange={e=>{addFiles([...(e.target.files||[])]);e.target.value=''}}/>
   <div className="cap-actions">
    <button type="button" className="cap-btn dark" onClick={()=>cameraInput.current?.click()}><Camera size={28}/><span><b>Fotoğraf çek</b><small>Arka arkaya çekebilirsin</small></span></button>
    <button type="button" className="cap-btn soft" onClick={()=>fileInput.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();addFiles([...e.dataTransfer.files])}}><Images size={28}/><span><b>Galeriden seç</b><small>İstediğin kadar soru</small></span></button>
   </div>
   <div className="cap-list-head"><h3>Seçilen sorular</h3><span aria-live="polite"><b>{items.length}</b> soru</span></div>
   {items.length?<ol className="cap-grid" aria-label="Seçilen soru fotoğrafları">{items.map((it,i)=><li key={it.id} className="cap-shot"><img src={it.preview} alt={`${i+1}. soru fotoğrafı (${it.file.name||'fotoğraf'}, ${fmt(it.file.size)})`}/><span className="cap-num" aria-hidden="true">{i+1}</span><button type="button" className="cap-remove" aria-label={`${i+1}. soruyu kaldır`} onClick={()=>{URL.revokeObjectURL(it.preview);setItems(cur=>cur.filter(x=>x.id!==it.id))}}><X size={14}/></button></li>)}</ol>
   :<p className="cap-empty">Henüz soru seçmedin. Çek ya da galeriden seç; fotoğraflar burada numaralanır.</p>}
   <p className="cap-hint">Bir fotoğrafta tek soru olsun; bulanık çekimde “emin olamadık” diye işaretleriz. En fazla {MAX_PER_BATCH} soru bir seferde.{!ai&&' Yapay zekâ şu an kapalı: sorular kaydedilir, ders ve konuyu sen seçersin.'}</p>
   <QuotaNote kind="classify"/>
   <div className="cap-foot"><button type="button" className="primary full cap-main" disabled={!items.length} onClick={()=>void start()}><Sparkles size={20}/> {items.length?`${items.length} soruyu tanı`:'Önce soru seç'}</button></div>
  </>:<TagReview items={items} busy={busy} ai={ai} hinted={hinted} onPatch={patch} onRetry={it=>void retry(it)} onFinish={finish}/>}
 </DialogContent></Dialog>}
