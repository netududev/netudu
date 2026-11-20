import {z} from 'zod';
import {owner,failure,json,AppError} from '@/lib/server';
import {today} from '@/lib/study';
import {readFlex,writeFlex,deleteFlex} from '@/lib/plan/flex-store';
import {normalizeFlexConfig,buildPlan,extendPlan,regeneratePlan,addDays,LIMITS,type FlexPlan,type FlexTask} from '@/lib/plan/flex';
// Esnek görev planı: oku (ufuk gerekirse uzar) / kur-güncelle (yapılanlar ve elle düzenlenenler korunur) / görev işlemleri / sil
const date=z.string().regex(/^20\d{2}-\d{2}-\d{2}$/);
const actions=z.discriminatedUnion('action',[
 z.object({action:z.literal('toggle'),id:z.string().max(40),done:z.boolean()}),
 z.object({action:z.literal('add'),date,title:z.string().trim().min(1).max(120),detail:z.string().trim().max(240).optional()}),
 z.object({action:z.literal('update'),id:z.string().max(40),title:z.string().trim().min(1).max(120).optional(),detail:z.string().trim().max(240).optional(),date:date.optional()}),
 z.object({action:z.literal('remove'),id:z.string().max(40)}),
 z.object({action:z.literal('regenerate')})
]);
const headers={'Cache-Control':'private, no-store'};
const inRange=(d:string,t:string)=>d>=addDays(t,-60)&&d<=addDays(t,730);
export async function GET(req:Request){try{const user=await owner(req);let plan=await readFlex(user);
 if(plan){const ext=extendPlan(plan,today());if(ext!==plan)plan=await writeFlex(user,ext)}
 return Response.json({plan},{headers})}catch(e){return failure(e)}}
export async function PUT(req:Request){try{const user=await owner(req);const body=await json(req) as {config?:unknown};const now=today();
 if(!body?.config||typeof body.config!=='object')throw new AppError('Program ayarları eksik.');
 const cur=await readFlex(user);const cfg=normalizeFlexConfig({...(body.config as object),startDate:cur?.config.startDate||now},now);
 const plan=cur?regeneratePlan(cur,cfg,now):buildPlan(cfg,now);
 return Response.json({plan:await writeFlex(user,plan)})}catch(e){return failure(e)}}
export async function POST(req:Request){try{const user=await owner(req);const p=actions.safeParse(await json(req));if(!p.success)throw new AppError('Geçersiz görev işlemi.');const a=p.data;const now=today();
 const cur=await readFlex(user);if(!cur)throw new AppError('Önce görev planını oluştur.',404);
 let next:FlexPlan;const find=(id:string)=>{const t=cur.tasks.find(x=>x.id===id);if(!t)throw new AppError('Görev bulunamadı.',404);return t};
 if(a.action==='toggle'){find(a.id);next={...cur,tasks:cur.tasks.map(t=>t.id===a.id?{...t,done:a.done}:t)}}
 else if(a.action==='add'){if(!inRange(a.date,now))throw new AppError('Bu tarih program aralığının dışında.');
  if(cur.tasks.filter(t=>t.date===a.date).length>=LIMITS.maxPerDay)throw new AppError(`Bir güne en fazla ${LIMITS.maxPerDay} görev eklenebilir.`);
  if(cur.tasks.length>=LIMITS.maxTasks)throw new AppError('Görev sınırına ulaşıldı. Eski günlerin görevlerini sil.');
  const t:FlexTask={id:crypto.randomUUID().slice(0,12),date:a.date,kind:'ozel',exam:'',grade:'',subject:'',topic:'',title:a.title,detail:a.detail||'',done:false,manual:true};next={...cur,tasks:[...cur.tasks,t]}}
 else if(a.action==='update'){const old=find(a.id);const d=a.date||old.date;if(!inRange(d,now))throw new AppError('Bu tarih program aralığının dışında.');
  if(d!==old.date&&cur.tasks.filter(t=>t.date===d).length>=LIMITS.maxPerDay)throw new AppError(`Bir güne en fazla ${LIMITS.maxPerDay} görev eklenebilir.`);
  next={...cur,tasks:cur.tasks.map(t=>t.id===a.id?{...t,title:a.title??t.title,detail:a.detail??t.detail,date:d,manual:true}:t)}}
 else if(a.action==='remove'){find(a.id);next={...cur,tasks:cur.tasks.filter(t=>t.id!==a.id)}}
 else next=regeneratePlan(cur,cur.config,now);
 return Response.json({plan:await writeFlex(user,next)})}catch(e){return failure(e)}}
export async function DELETE(req:Request){try{const user=await owner(req);await deleteFlex(user);return Response.json({plan:null})}catch(e){return failure(e)}}
