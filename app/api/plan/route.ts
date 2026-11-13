import {owner,db,failure,json,AppError} from '@/lib/server';
import {configSchema,readPlan,writePlan} from '@/lib/plan/store';
import type {PlanConfig} from '@/lib/plan/scheduler';
// Ders çalışma programı: oku / kur-güncelle (ilerleme korunur) / sıfırla
export async function GET(req:Request){try{const user=await owner(req);return Response.json({plan:await readPlan(user)},{headers:{'Cache-Control':'private, no-store'}})}catch(e){return failure(e)}}
export async function PUT(req:Request){try{const user=await owner(req);const body=await json(req) as {config?:any;resetProgress?:boolean};const p=configSchema.safeParse(body?.config&&typeof body.config==='object'?{...body.config,resources:[]}:body?.config);if(!p.success)throw new AppError('Program ayarlarını kontrol et (saatler SS:DD biçiminde olmalı, sabit bloklara en az bir gün seç).');
 // Kaynaklar yalnız /api/plan/resources ile değişir: sihirbaz kaydı mevcut kaynakları ezmez
 const cur=await readPlan(user);const plan=await writePlan(user,{config:{...p.data,resources:cur?.config.resources??[]} as PlanConfig,...(body.resetProgress?{done:{},offDays:{}}:{})});return Response.json({plan})}catch(e){return failure(e)}}
export async function DELETE(req:Request){try{const user=await owner(req);await db().prepare('DELETE FROM study_plans WHERE user_id=?').bind(user).run();return Response.json({plan:null})}catch(e){return failure(e)}}
