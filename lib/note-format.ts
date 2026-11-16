// Görsel ders notu biçimi: yapay zekâ yapılandırılmış JSON üretir, istemci kartlar ve diyagramlar olarak çizer.
// Veritabanı şeması değişmez: `study_notes.content` alanına "ndnote1:" önekli JSON metin yazılır.
// Önek yoksa içerik ESKİ düz metin/markdown nottur ve eskisi gibi gösterilir (geriye uyum).
import {z} from 'zod';
export const NOTE_PREFIX='ndnote1:';
const s=(max:number)=>z.string().trim().min(1).max(max);
const cap=(n:number)=>(v:unknown)=>Array.isArray(v)?v.slice(0,n):v;
const list=<T extends z.ZodTypeAny>(item:T,max:number)=>z.preprocess(cap(max),z.array(item).min(1));
const layer=z.object({label:s(80),text:s(200)});
const step=z.object({title:s(80),body:s(240)});
const pattern=z.object({q:s(140),a:s(200)});
const item=z.object({label:s(60),text:s(160).optional().catch(undefined),points:z.preprocess(cap(5),z.array(s(120)).min(1)).optional().catch(undefined)});
const diagram=z.object({type:z.enum(['flow','compare','cycle']),title:s(80).optional().catch(undefined),items:z.array(item).min(2)}).superRefine((d,ctx)=>{
 const n=d.items.length;const bad=d.type==='flow'?n>7:d.type==='cycle'?n<3||n>6:n>3;
 if(bad)ctx.addIssue({code:'custom',message:'Öğe sayısı bu diyagram türü için uygun değil'})});
export const noteSchema=z.object({
 title:s(120),oneLiner:s(240),
 layers:list(layer,4).optional().catch(undefined),
 rule:z.object({formula:s(200),plain:s(260)}).optional().catch(undefined),
 steps:list(step,5).optional().catch(undefined),
 mistakes:list(s(200),4).optional().catch(undefined),
 patterns:list(pattern,4).optional().catch(undefined),
 memory:s(240).optional().catch(undefined),
 diagram:diagram.optional().catch(undefined)
}).refine(n=>!!(n.layers||n.rule||n.steps||n.diagram),{message:'Not en az bir görsel bölüm içermeli'});
export type VisualNote=z.infer<typeof noteSchema>;
export type NoteDiagram=NonNullable<VisualNote['diagram']>;
export const serializeNote=(n:VisualNote)=>NOTE_PREFIX+JSON.stringify(n);
export const isVisualNote=(c:unknown)=>typeof c==='string'&&c.startsWith(NOTE_PREFIX);
export type ParsedContent={kind:'visual';note:VisualNote}|{kind:'legacy';text:string};
export function parseNoteContent(content:string):ParsedContent{
 if(isVisualNote(content)){try{const r=noteSchema.safeParse(JSON.parse(content.slice(NOTE_PREFIX.length)));if(r.success)return {kind:'visual',note:r.data}}catch{}}
 return {kind:'legacy',text:content};
}
// Yapay zekâ yanıtı (JSON metin, kod çitli olabilir) → doğrulanmış not ya da null.
export function parseModelNote(raw:string):VisualNote|null{
 try{const r=noteSchema.safeParse(JSON.parse(raw.replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,'').trim()));return r.success?r.data:null}catch{return null}
}
export function noteToText(n:VisualNote){
 const out=[n.title,n.oneLiner];
 if(n.layers)out.push('',...n.layers.map(l=>`${l.label}: ${l.text}`));
 if(n.rule)out.push('','KURAL: '+n.rule.formula,n.rule.plain);
 if(n.diagram){out.push('',(n.diagram.title||'ŞEMA').toLocaleUpperCase('tr'));for(const i of n.diagram.items)out.push(`- ${i.label}${i.text?': '+i.text:''}${i.points?' ('+i.points.join('; ')+')':''}`)}
 if(n.steps)out.push('','ÇÖZÜLMÜŞ ÖRNEK',...n.steps.map((x,i)=>`${i+1}. ${x.title}: ${x.body}`));
 if(n.mistakes)out.push('','SIK HATA',...n.mistakes.map(m=>'- '+m));
 if(n.patterns)out.push('','AYNI KALIP',...n.patterns.map(p=>`${p.q} = ${p.a}`));
 if(n.memory)out.push('','AKILDA TUT: '+n.memory);
 return out.join('\n');
}
// Önceki not (düz metin ya da görsel) → modele verilecek ya da yazdırılacak düz metin.
export function contentToText(content:string){const p=parseNoteContent(content);return p.kind==='visual'?noteToText(p.note):p.text}
