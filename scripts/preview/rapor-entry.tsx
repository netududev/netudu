// Aylık rapor, Denemeler, Ders notları ve Ayarlar önizlemeleri: gerçek bileşenlerin SSR çıktısı, örnek veriyle. Veriler ÖRNEKTİR.
import * as React from 'react';
import {renderToStaticMarkup as R} from 'react-dom/server';
import {StudyContext} from '@/app/study/shared';
import {ReportView} from '@/app/study/report';
import {NotesView} from '@/app/study/notes';
import {SettingsView} from '@/app/study/settings';
import {ExamsView} from '@/app/study/exams';
import {serializeNote} from '@/lib/note-format';
import {shell,study,rows} from './shell-entry';
export * from './shell-entry';

const frame=(view:string,body:React.ReactNode,o:any={})=>shell(view,{body,...o});
export const exams=[
 {id:'e1',name:'3D TYT 1',exam_type:'TYT',date:'2026-09-14',net:62.5,correct:70,wrong:30,blank:20,notes:'',created_at:'2026-09-14'},
 {id:'e2',name:'3D TYT 2',exam_type:'TYT',date:'2026-10-05',net:68,correct:75,wrong:28,blank:17,notes:'Süre yetmedi',created_at:'2026-10-05'},
 {id:'e3',name:'Özdebir AYT 1',exam_type:'AYT',date:'2026-10-26',net:41.25,correct:50,wrong:35,blank:15,notes:'',created_at:'2026-10-26'},
 {id:'e4',name:'3D TYT 3 uzun adlı deneme sınavı',exam_type:'TYT',date:'2026-11-09',net:71.75,correct:80,wrong:25,blank:15,notes:'Geometriye geç başladım ve paragrafta süre kaybettim',created_at:'2026-11-09'},
] as any[];
export const sampleNote=serializeNote({title:'Üslü sayılar',oneLiner:'Üs, tabanın kendisiyle kaç kez çarpıldığını söyler.',
 layers:[{label:'Taban',text:'Çarpılan sayı'},{label:'Üs',text:'Kaç kez çarpıldığı'},{label:'Sonuç',text:'Kuvvet'}],
 rule:{formula:'aᵐ · aⁿ = aᵐ⁺ⁿ',plain:'Tabanlar aynıysa üsler toplanır.'},
 steps:[{title:'Tabanları karşılaştır',body:'İkisi de 2.'},{title:'Üsleri topla',body:'3 + 4 = 7.'},{title:'Sonucu yaz',body:'2⁷ = 128.'}],
 mistakes:['Tabanları da toplamak: 2³ · 2⁴ ≠ 4⁷'],patterns:[{q:'3² · 3⁵',a:'3⁷'}],memory:'Aynı taban, üsler toplanır.'} as any);
export const sampleNotes=[{id:'n1',subject:'Matematik',topic:'Üslü sayılar',exam_type:'TYT',content:sampleNote,prompt:'',updated_at:'2026-11-10T10:00:00Z'},{id:'n2',subject:'Fizik',topic:'Elektrik',exam_type:'AYT',content:'Düz metin not.',prompt:'',updated_at:'2026-11-08T10:00:00Z'}] as any[];
const goals=[{text:'Paragrafta günde 10 soru',done:true},{text:'Hafta sonu bir TYT denemesi',done:false}];
export const rapor=(o:any={})=>frame('report',<ReportView month="2026-11" notes={o.empty?'':'Türev ve limitte işlem hatası yaptım; haftada iki kez tekrar edeceğim.'} setNotes={()=>{}} goals={o.empty?[]:goals} setGoals={()=>{}} onPrint={()=>{}}/>,{month:'2026-11',setMonth(){},onAddExam(){}});
export const denemeler=(o:any={})=>frame('exams',<ExamsView/>,{study:{exams:o.empty?[]:exams},month:'2026-11',setMonth(){},onAddExam(){}});
export const notlar=(o:any={})=>frame('notes',<NotesView preset={null} initialNotes={o.empty?[]:sampleNotes} initialSelected={o.empty?null:sampleNotes[0]}/>);
export const ayarlar=(tab:string,dev:boolean)=>frame('settings',<SettingsView initialTab={tab}/>,{dev});
