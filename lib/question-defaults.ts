// Yeni soru kaydı: öğrenci artık deneme adı, tarih, sınav ya da ders girmez; eksik alanlar buradan varsayılanlanır.
// Şema ve çözümleme saf modüldedir (POST /api/questions ve testler aynı kodu kullanır).
import {z} from 'zod';
import {subjects,mistakeTypes,examTypes,normalizeTopic} from './study';
import {UNKNOWN_TOPIC} from './classify';
export const DEFAULT_EXAM='Yanlış defteri';
// Profil sınıfından sınav türü: Mezun ya da profil yoksa TYT; 9-12 → "N. Sınıf".
export function examTypeForGrade(grade?:string|null){const t=!grade||grade==='Mezun'?'TYT':grade+'. Sınıf';return (examTypes as readonly string[]).includes(t)?t:'TYT'}
// Biçim alanlarından gelen boş metin "verilmedi" demektir.
const opt=<T extends z.ZodTypeAny>(s:T)=>z.preprocess(v=>v===''||v===null?undefined:v,s.optional());
const isDate=(d:string)=>!Number.isNaN(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d;
export const createSchema=z.object({
 id:z.string().uuid(),
 exam:opt(z.string().trim().max(120)),
 examType:opt(z.enum(examTypes)),
 date:opt(z.string().regex(/^20\d{2}-\d{2}-\d{2}$/).refine(isDate)),
 subject:opt(z.enum(subjects as [string,...string[]])),
 topic:z.string().trim().max(150).default(''),
 question:z.string().trim().max(20000).default(''),
 myAnswer:z.string().max(500).default(''),
 answerKey:z.string().max(500).default(''),
 mistakeType:opt(z.enum(mistakeTypes))
});
export type CreateInput=z.infer<typeof createSchema>;
export function resolveCreate(p:CreateInput,ctx:{grade?:string|null;today:string}){
 const named=!!p.subject;const subject=p.subject||subjects[0];
 const topic=named&&p.topic?normalizeTopic(subject,p.topic):UNKNOWN_TOPIC;
 return {id:p.id,exam:p.exam||DEFAULT_EXAM,examType:p.examType||examTypeForGrade(ctx.grade),date:p.date||ctx.today,subject,topic,question:p.question,myAnswer:p.myAnswer,answerKey:p.answerKey,mistakeType:p.mistakeType||'yanlış',needsReview:!named||topic===UNKNOWN_TOPIC}
}
