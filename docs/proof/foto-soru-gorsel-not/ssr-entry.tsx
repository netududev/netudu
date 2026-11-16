import * as React from 'react';
import {renderToStaticMarkup as R} from 'react-dom/server';
import {Landing} from '@/app/study/landing';
import {NoteBody} from '@/app/study/note-visual';
import {TagReview} from '@/app/study/tag-review';
import {UploadDialog} from '@/app/study/upload-dialog';
import {StudyContext} from '@/app/study/shared';
import {serializeNote,noteSchema} from '@/lib/note-format';
import {initialClassification,manualClassification} from '@/lib/classify';
const study:any={ai:true,usage:null,upsert(){},bumpUsage(){},solve:async()=>{}};
const Ctx=({children}:any)=><StudyContext.Provider value={study}>{children}</StudyContext.Provider>;
export const landing=()=>R(<Landing onAuth={()=>{}}/>);
const sheet=(n:number)=>'data:image/svg+xml;utf8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="150" height="200" viewBox="0 0 150 200"><rect width="150" height="200" fill="#F4F1EA"/><g fill="#CFCAC0"><rect x="14" y="18" width="${70+n*6}" height="6" rx="3"/><rect x="14" y="32" width="120" height="6" rx="3"/><rect x="14" y="46" width="108" height="6" rx="3"/></g><rect x="14" y="66" width="122" height="46" rx="6" fill="#E4DFD3"/><g fill="#CFCAC0"><rect x="14" y="126" width="80" height="6" rx="3"/><rect x="14" y="140" width="112" height="6" rx="3"/></g></svg>`);
export const pickStep=(count:number)=>{
 let html=R(<Ctx><UploadDialog open={true} files={[]} onClose={()=>{}}/></Ctx>);
 const grid='<ol class="cap-grid" aria-label="Seçilen soru fotoğrafları">'+Array.from({length:count},(_,i)=>`<li class="cap-shot"><img src="${sheet(i)}" alt="${i+1}. soru fotoğrafı"/><span class="cap-num" aria-hidden="true">${i+1}</span><button type="button" class="cap-remove" aria-label="${i+1}. soruyu kaldır"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg></button></li>`).join('')+'</ol>';
 html=html.replace(/<p class="cap-empty">.*?<\/p>/,grid).replace('<b>0</b> soru',`<b>${count}</b> soru`).replace('disabled="" ','').replace('Önce soru seç',`${count} soruyu tanı`);
 return html};
const q=(o:any)=>({id:o.id,subject:o.subject,topic:o.topic,exam_type:o.exam_type,analysis:o.analysis,mistake_type:'yanlış',image_key:'available'}) as any;
const cls=(subtopic:string,difficulty:string,needs=false,reason='')=>({classification:{subtopic,difficulty,confidence:needs?.4:.92,needsReview:needs,source:'ai',...(reason?{reason}:{})}});
const it=(i:number,status:string,question?:any,message='')=>({id:'i'+i,file:null as any,preview:sheet(i),status,question,message}) as any;
export const tagItems=()=>[
 it(0,'hazır',q({id:'a',subject:'Matematik',topic:'Türev',exam_type:'AYT',analysis:cls('Zincir kuralı','orta')})),
 it(1,'hazır',q({id:'b',subject:'Türk Dili ve Edebiyatı',topic:'Paragraf',exam_type:'TYT',analysis:cls('Ana düşünce','kolay')})),
 it(2,'kontrol',q({id:'c',subject:'Kimya',topic:'Konu belirlenmedi',exam_type:'TYT',analysis:cls('Mol kavramı','',true,'Fotoğraf biraz bulanık, kontrol et.')})),
 it(3,'hazır',q({id:'d',subject:'Fizik',topic:'Elektrik',exam_type:'TYT',analysis:cls('Ohm yasası','kolay')})),
 it(4,'tanınıyor'),it(5,'hata',undefined,'Bağlanılamadı. İnternet bağlantını kontrol edip tekrar dene.')];
export const tagReview=(busy=false)=>R(<Ctx><TagReview items={tagItems()} busy={busy} ai={true} hinted={false} onPatch={()=>{}} onRetry={()=>{}} onFinish={()=>{}}/></Ctx>);
export const note=(n:any)=>R(<NoteBody content={serializeNote(noteSchema.parse(n))}/>);
export const legacy=(t:string)=>R(<NoteBody content={t}/>);
void initialClassification;void manualClassification;
