import {subjects as subjectList,type MistakeType} from './topics';
export {topicTree,normalizeTopic,mistakeTypes,mebTopics,topicOptions,topicMeta,mebGrades} from './topics';
export type Profile={name:string;grade:'9'|'10'|'11'|'12'|'Mezun';target:string;examYear:number;examDate:string;motto:string;dailyGoal:number;school:string};
// YKS haziranın üçüncü cumartesi/pazar haftasonu yapılır; ÖSYM açıklayana kadar tahmini tarih: haziranın 3. cumartesisi.
export function estimatedExamDate(year:number){const d=new Date(Date.UTC(year,5,1));const first=(6-d.getUTCDay()+7)%7+1;return `${year}-06-${String(first+14).padStart(2,'0')}`}
// Sınıfa göre hedef YKS yılı: eğitim yılı temmuzda değişir. 12. sınıf/mezun → bu eğitim yılının haziranı.
export function defaultExamYear(grade:string,now=new Date()){const base=now.getUTCMonth()>=6?now.getUTCFullYear()+1:now.getUTCFullYear();const g=Number(grade);return Number.isFinite(g)&&g>=9&&g<=12?base+(12-g):base}
export function profileFor(name:string,grade:Profile['grade']='12'):Profile{const y=defaultExamYear(grade);return {name,grade,target:'',examYear:y,examDate:estimatedExamDate(y),motto:'Her yanlış, bir sonraki doğruya.',dailyGoal:0,school:''}}
export const defaultProfile:Profile=profileFor('','12');
// Türkçe iyelik eki: Yusuf → Yusuf'un, Ayşe → Ayşe'nin, Ali → Ali'nin, Ahmet → Ahmet'in
export function genitive(name:string){const n=name.trim();const v=[...n.toLocaleLowerCase('tr')].reverse().find(c=>'aeıioöuü'.includes(c))||'e';const suffix=('aı'.includes(v)?'ın':'ei'.includes(v)?'in':'ou'.includes(v)?'un':'ün');const lastIsVowel='aeıioöuü'.includes(n.toLocaleLowerCase('tr').slice(-1));return `${n}'${lastIsVowel?'n':''}${suffix}`}
export const initials=(name:string)=>name.trim().split(/\s+/).map(w=>w[0]||'').join('').slice(0,2).toLocaleUpperCase('tr');
export const examTypes=['TYT','AYT','9. Sınıf','10. Sınıf','11. Sınıf','12. Sınıf'] as const;
export type ExamType=typeof examTypes[number];
// Sınav türünden sınıf anahtarı: konu menüsünde ilgili sınıfın üniteleri öne alınır
export const gradeOfExam=(t:string)=>{const m=/^(\d+)\. Sınıf$/.exec(t);return m?m[1]:''};
export const subjects=subjectList;
export type Video={title:string;url:string;reason:string;channel?:string;duration?:string;views?:number;source?:'youtube-api'|'web-search'};
export type Analysis={readable:boolean;subject:string;topic:string;transcription:string;answer:string;steps:string[];pitfall:string;note:string;confidence:string;answerKeyMatch:boolean|null;videos:Video[];videoNotice?:string;verification?:string;errorType?:string;classification?:{subtopic:string;difficulty:string;confidence:number;needsReview:boolean;source:'ai'|'manual'|'none';reason?:string}};// Çözümsüz kayıtta analysis yalnız classification içerir (lib/classify.ts)
export type ReviewEntry={date:string;result:'doğru'|'yanlış'};
export type Question={id:string;exam:string;exam_type:string;date:string;subject:string;topic:string;question:string;my_answer:string;answer_key:string;image_key?:string|null;analysis:Analysis|null;reviewed:number;created_at:string;mistake_type:MistakeType|string;review_stage:number;next_review:string|null;review_log:ReviewEntry[]};
export type Exam={id:string;name:string;exam_type:string;date:string;net:number;correct:number|null;wrong:number|null;blank:number|null;notes:string;created_at:string};
export type Goal={text:string;done:boolean};
export type Report={month:string;notes:string;goals:Goal[];updated_at:string};
export type StudyNote={id:string;subject:string;topic:string;exam_type:string;content:string;prompt:string;updated_at:string};
export function today(){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Istanbul'}).format(new Date())}
export function addDays(date:string,days:number){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10)}
export function prevMonth(month:string){const [y,m]=month.split('-').map(Number);const d=new Date(Date.UTC(y,m-2,1));return d.toISOString().slice(0,7)}
// Aralıklı tekrar aralıkları (gün): 1 → 3 → 7 → 14 → 30 → 60. Doğru çözülürse bir sonraki aşamaya geçer,
// yanlış çözülürse aşama sıfırlanır ve soru ertesi gün yeniden gelir.
export const reviewIntervals=[1,3,7,14,30,60];
export function scheduleReview(stage:number,result:'doğru'|'yanlış',from=today()){const next=result==='doğru'?Math.min(stage+1,reviewIntervals.length):0;const days=reviewIntervals[Math.min(next,reviewIntervals.length-1)];return {stage:next,nextReview:next>=reviewIntervals.length?null:addDays(from,days)}}
export const reviewStageLabel=(q:Pick<Question,'review_stage'|'next_review'|'review_log'>)=>q.review_stage>=reviewIntervals.length?'Öğrenildi':q.review_stage===0?(q.review_log?.length?'Yeniden başla':'Yeni'):`${q.review_stage}. tekrar`;
export function dueQuestions(rows:Question[],date=today()){return rows.filter(q=>q.next_review&&q.next_review<=date).sort((a,b)=>(a.next_review||'').localeCompare(b.next_review||'')||a.subject.localeCompare(b.subject,'tr'))}
export type TopicStat={subject:string;topic:string;count:number;reviewed:number;notes:string[];prev:number;blank:number;unsure:number;questions:Question[]};
// Tanınamayan soru: ders/konu henüz belirlenmedi ve kontrol bekliyor. Kayıtta ders yer tutucudur; ders bazlı sayımlara girmez.
export const isUnrecognized=(q:Pick<Question,'topic'|'analysis'>)=>q.topic==='Konu belirlenmedi'&&q.analysis?.classification?.needsReview===true;
export const unrecognizedCount=(rows:Question[],month:string)=>rows.filter(q=>q.date.startsWith(month)&&isUnrecognized(q)).length;
// Çözüm denendi mi? (analysis tek başına çözüm değildir: yalnız classification içerebilir; okunamayan çözümde steps boş dizidir)
export const hasSolution=(a:Partial<Analysis>|null|undefined)=>Array.isArray(a?.steps);
export function monthlyTopics(rows:Question[],month:string):TopicStat[]{rows=rows.filter(q=>!isUnrecognized(q));const map=new Map<string,TopicStat>();const before=prevMonth(month);const prevCounts=new Map<string,number>();for(const q of rows.filter(q=>q.date.startsWith(before))){const k=q.subject+'|'+q.topic;prevCounts.set(k,(prevCounts.get(k)||0)+1)}for(const q of rows.filter(q=>q.date.startsWith(month))){const k=q.subject+'|'+q.topic;const v=map.get(k)||{subject:q.subject,topic:q.topic,count:0,reviewed:0,notes:[],prev:prevCounts.get(k)||0,blank:0,unsure:0,questions:[]};v.count++;v.reviewed+=q.reviewed?1:0;if(q.mistake_type==='boş')v.blank++;if(q.mistake_type==='emin değildim')v.unsure++;v.questions.push(q);if(q.analysis?.note&&!v.notes.includes(q.analysis.note))v.notes.push(q.analysis.note);map.set(k,v)}return [...map.values()].sort((a,b)=>b.count-a.count||a.topic.localeCompare(b.topic,'tr'))}
// Konu bazında tüm zamanlar: "bu konuyu daha önce N kez yanlış yaptın"
export function topicHistory(rows:Question[],subject:string,topic:string,excludeId?:string){return rows.filter(q=>q.subject===subject&&q.topic===topic&&q.id!==excludeId)}
// Deneme bazında yanlış sayısı (grafik için)
export function wrongsPerExam(rows:Question[]){const map=new Map<string,{exam:string;date:string;exam_type:string;count:number}>();for(const q of rows){const k=q.date+'|'+q.exam;const v=map.get(k)||{exam:q.exam,date:q.date,exam_type:q.exam_type,count:0};v.count++;map.set(k,v)}return [...map.values()].sort((a,b)=>a.date.localeCompare(b.date))}
export const exportColumns=['Tarih','Deneme','Sınav','Ders','Konu','Hata türü','Soru','Cevabım','Cevap anahtarı','Çözüm sonucu','Çözüm','Kritik nokta','Tekrar notu','Video','Tekrar aşaması','Sıradaki tekrar','Durum'];
export function exportRows(rows:Question[]):(string|number)[][]{return rows.map(q=>[q.date,q.exam,q.exam_type,q.subject,q.topic,q.mistake_type||'yanlış',q.question,q.my_answer,q.answer_key,q.analysis?.answer||'',q.analysis?.steps?.join('\n')||'',q.analysis?.pitfall||'',q.analysis?.note||'',q.analysis?.videos?.[0]?.url||'',reviewStageLabel(q),q.next_review||'',q.reviewed?'Tekrar edildi':'Tekrar bekliyor'])}
export function csv(rows:Question[]){const cell=(v:unknown)=>{let s=String(v??'');if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"'};return '\uFEFF'+[exportColumns,...exportRows(rows)].map(r=>r.map(cell).join(';')).join('\r\n')}
export function daysUntil(date:string,from=today()){return Math.round((Date.parse(date+'T00:00:00Z')-Date.parse(from+'T00:00:00Z'))/86400000)}
