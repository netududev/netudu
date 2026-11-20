// Esnek görev planının veritabanı katmanı (flex_plans tablosu). Eski saatli program (study_plans) ile ilgisi yoktur.
import {db} from '../server';
import {normalizeFlexConfig,LIMITS,type FlexPlan,type FlexTask,type TaskKind} from './flex';

const KINDS:TaskKind[]=['konu','tekrar','soru','paragraf','deneme','analiz','ozel'];
const DATE=/^20\d{2}-\d{2}-\d{2}$/;
const str=(v:unknown,max:number)=>typeof v==='string'?v.slice(0,max):'';
const parse=<T,>(v:unknown,f:T):T=>{try{return v?JSON.parse(String(v)):f}catch{return f}};
// Bozuk ya da eski kayıtlar sessizce elenir; tek bozuk görev tüm planı açılmaz yapmaz.
export function cleanTask(raw:any):FlexTask|null{
 if(!raw||typeof raw!=='object'||typeof raw.id!=='string'||!raw.id||!DATE.test(String(raw.date))||!KINDS.includes(raw.kind))return null;
 const title=str(raw.title,120).trim();if(!title)return null;
 return {id:raw.id.slice(0,40),date:raw.date,kind:raw.kind,exam:raw.exam==='TYT'||raw.exam==='AYT'?raw.exam:'',grade:str(raw.grade,4),subject:str(raw.subject,60),topic:str(raw.topic,200),title,detail:str(raw.detail,240),done:!!raw.done,manual:!!raw.manual,
  ...(typeof raw.pool==='string'?{pool:raw.pool.slice(0,12)}:{}),...(typeof raw.from==='string'?{from:raw.from.slice(0,40)}:{}),...(Number.isInteger(raw.step)?{step:raw.step}:{})}}
export function packFlex(row:any):FlexPlan|null{if(!row)return null;
 const raw=parse<any>(row.config,null);if(!raw||typeof raw!=='object')return null;
 const config=normalizeFlexConfig(raw);const tasks=(Array.isArray(parse<any>(row.tasks,[]))?parse<any[]>(row.tasks,[]):[]).map(cleanTask).filter((t):t is FlexTask=>!!t).slice(0,LIMITS.maxTasks);
 return {config,tasks,horizon:DATE.test(String(row.horizon))?String(row.horizon):config.startDate,updated_at:String(row.updated_at||'')}}
export async function readFlex(user:string){return packFlex(await db().prepare('SELECT * FROM flex_plans WHERE user_id=?').bind(user).first())}
export async function writeFlex(user:string,p:FlexPlan){const now=new Date().toISOString();
 await db().prepare('INSERT INTO flex_plans (user_id,config,tasks,horizon,created_at,updated_at) VALUES (?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET config=excluded.config,tasks=excluded.tasks,horizon=excluded.horizon,updated_at=excluded.updated_at')
  .bind(user,JSON.stringify(p.config),JSON.stringify(p.tasks.slice(0,LIMITS.maxTasks)),p.horizon,now,now).run();
 return readFlex(user)}
export async function deleteFlex(user:string){await db().prepare('DELETE FROM flex_plans WHERE user_id=?').bind(user).run()}
