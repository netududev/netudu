// Kaynaklar için zod şemaları: saklanan kayıt (config.resources) ve API eylemleri. Veritabanı şeması değişmez; kaynaklar plan config JSON'ındadır.
import {z} from 'zod';
import {ALL_DAYS} from './curriculum';
import {LIMITS,LIST_ID,VIDEO_ID} from './resources';
const day=z.enum(ALL_DAYS);
const num=(lo:number,hi:number)=>z.number().int().min(lo).max(hi);
const days=z.array(day).min(1).max(7);
const item=z.object({id:z.string().regex(VIDEO_ID),title:z.string().max(LIMITS.title)});
const date=z.string().regex(/^20\d{2}-\d{2}-\d{2}$/);
// Saklanan kaynak. Okuma yolu (packPlan) bunu zod ile değil normalizeResources ile okur: tek bozuk kaynak programı açılmaz yapmasın.
export const resourceSchema=z.object({
 id:z.string().min(1).max(60),kind:z.enum(['book','playlist']),name:z.string().trim().min(1).max(LIMITS.name),subject:z.string().trim().max(LIMITS.subject).default(''),
 unit:z.enum(['test','sayfa','video']),total:num(1,LIMITS.total),done:num(0,LIMITS.total),perDay:num(1,LIMITS.perDay),minPerUnit:num(1,LIMITS.minPerUnit),days,
 listId:z.string().regex(LIST_ID).optional(),items:z.array(item).max(LIMITS.items).optional(),watched:z.array(num(1,LIMITS.total)).max(LIMITS.total).optional(),
 log:z.object({date,units:z.array(num(1,LIMITS.total)).max(LIMITS.log)}).optional()
}).refine(r=>r.kind==='book'?r.unit!=='video':r.unit==='video'&&!!r.listId,{message:'Kaynak türü ile birimi uyuşmuyor.'});

// Tüm kaynaklar: en çok LIMITS.resources kaynak ve toplam LIMITS.itemsTotal playlist başlığı (config boyutu sınırı)
export const ITEMS_TOTAL_MESSAGE=`Toplam en fazla ${LIMITS.itemsTotal} video başlığı saklanabilir. Önce bir oynatma listesini sil ya da video sayısını elle gir.`;
export const resourcesSchema=z.array(resourceSchema).max(LIMITS.resources).refine(l=>l.reduce((a,r)=>a+(r.items?.length||0),0)<=LIMITS.itemsTotal,{message:ITEMS_TOTAL_MESSAGE});

const base={name:z.string().trim().min(1).max(LIMITS.name),subject:z.string().trim().max(LIMITS.subject).default(''),total:num(1,LIMITS.total),done:num(0,LIMITS.total).default(0),perDay:num(1,LIMITS.perDay),minPerUnit:num(1,LIMITS.minPerUnit).optional(),days:days.default([...ALL_DAYS])};
export const addSchema=z.discriminatedUnion('kind',[
 z.object({kind:z.literal('book'),unit:z.enum(['test','sayfa']),...base}),
 z.object({kind:z.literal('playlist'),url:z.string().trim().min(1).max(300),items:z.array(item).max(LIMITS.items).default([]),...base})
]);
const opSchema=z.discriminatedUnion('mode',[
 z.object({mode:z.literal('delta'),delta:num(-LIMITS.perDay,LIMITS.perDay)}),
 z.object({mode:z.literal('set'),position:num(0,LIMITS.total)}),
 z.object({mode:z.literal('toggle'),index:num(1,LIMITS.total)})
]);
const id=z.string().min(1).max(60);
// today: istemcinin yerel günü (sunucu saatinden en çok 1 gün sapabilir; aksi hâlde sunucu günü kullanılır)
const today=date.optional();
export const actionSchema=z.discriminatedUnion('action',[
 z.object({action:z.literal('add'),resource:addSchema}),
 z.object({action:z.literal('update'),id,fields:z.object({name:base.name,subject:base.subject,unit:z.enum(['test','sayfa']),total:base.total,perDay:base.perDay,minPerUnit:num(1,LIMITS.minPerUnit),days}).partial()}),
 z.object({action:z.literal('remove'),id}),
 z.object({action:z.literal('progress'),id,op:opSchema,today}),
 z.object({action:z.literal('complete-today'),id,today}),
 z.object({action:z.literal('undo-today'),id,today}),
 z.object({action:z.literal('fetch-playlist'),url:z.string().trim().min(1).max(300)})
]);
