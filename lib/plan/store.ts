// Ders çalışma programının veritabanı katmanı (study_plans tablosu)
import {z} from 'zod';
import {db} from '../server';
import {ALL_DAYS,normalizePlanConfig,type PlanConfig,type PlanState} from './scheduler';
import {resourcesSchema} from './resource-schema';
import {LIMITS} from './resources';
const time=z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const day=z.enum(ALL_DAYS);
// Eski kayıtlardaki `sport` alanı şemada yoktur: zod nesneleri varsayılan olarak bilinmeyen anahtarları atar, böylece eski planlar okunur/kaydedilir.
export const configSchema=z.object({
 school:z.object({enabled:z.boolean(),title:z.string().trim().max(60).default('Okul'),days:z.array(day).max(7),start:time,end:time}),
 fixedBlocks:z.array(z.object({id:z.string().max(60),title:z.string().trim().min(1).max(80),days:z.array(day).min(1).max(7),start:time,end:time})).max(40),
 tempo:z.enum(['relaxed','balanced','intense']),
 dayStart:time,dayEnd:time,
 startDate:z.string().regex(/^20\d{2}-\d{2}-\d{2}$/),
 alarm:z.object({enabled:z.boolean(),time,blockReminders:z.boolean().default(true)}),
 // Kaynaklar (soru bankası / oynatma listesi) config JSON'ında yaşar; eski kayıtlarda yoktur
 resources:resourcesSchema.default([])
});
const parse=<T,>(v:unknown,f:T):T=>{try{return v?JSON.parse(String(v)):f}catch{return f}};
// Kaynaklar şemayla değil normalizeResources ile okunur (normalizePlanConfig içinde): tek bozuk kaynak tüm programı açılmaz yapmaz.
export function packPlan(row:any):PlanState|null{if(!row)return null;const raw=parse<any>(row.config,null);const c=configSchema.safeParse(raw&&typeof raw==='object'?{...raw,resources:[]}:raw);if(!c.success)return null;return {config:normalizePlanConfig({...c.data,resources:raw.resources},c.data.startDate) as PlanConfig,done:parse(row.done,{}),offDays:parse(row.off_days,{}),updated_at:String(row.updated_at||'')}}
export async function readPlan(user:string){return packPlan(await db().prepare('SELECT * FROM study_plans WHERE user_id=?').bind(user).first())}
export async function writePlan(user:string,p:{config?:PlanConfig;done?:Record<string,string>;offDays?:Record<string,unknown>}){const now=new Date().toISOString();const cur=await readPlan(user);const config=p.config||cur?.config;if(!config)return null;
 await db().prepare('INSERT INTO study_plans (user_id,config,done,off_days,created_at,updated_at) VALUES (?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET config=excluded.config,done=excluded.done,off_days=excluded.off_days,updated_at=excluded.updated_at').bind(user,JSON.stringify(config),JSON.stringify(p.done??cur?.done??{}),JSON.stringify(p.offDays??cur?.offDays??{}),now,now).run();return readPlan(user)}
