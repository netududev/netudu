import {z} from 'zod';
import {requireUser,db,activeSupabaseConfig,failure,json,AppError} from '@/lib/server';
import {supabaseAuthUpdateProfile} from '@/lib/supabase';
import {packProfile as pack} from '@/lib/profile';
export async function GET(req:Request){try{const me=await requireUser(req);const user=me.tenantId||me.id;let row=await db().prepare('SELECT * FROM profiles WHERE user_id=?').bind(user).first();if(!row&&me.id!==user)row=await db().prepare('SELECT * FROM profiles WHERE user_id=?').bind(me.id).first();return Response.json({profile:pack(row)},{headers:{'Cache-Control':'private, no-store'}})}catch(e){return failure(e)}}
// Profil güncelle: ad, sınıf, hedef bölüm, sınav yılı/tarihi, motto, günlük soru hedefi, okul
export async function PUT(req:Request){try{
 const me=await requireUser(req);
 const user=me.tenantId||me.id;
 const p=z.object({name:z.string().trim().min(2).max(60),grade:z.enum(['9','10','11','12','Mezun']),target:z.string().trim().max(80).default(''),examYear:z.number().int().min(2026).max(2035),examDate:z.string().regex(/^20\d{2}-\d{2}-\d{2}$/),motto:z.string().trim().max(120).default(''),dailyGoal:z.number().int().min(0).max(500).default(0),school:z.string().trim().max(80).default('')}).safeParse(await json(req));
 if(!p.success)throw new AppError('Profil alanlarını kontrol et (ad en az 2 karakter, tarih geçerli olmalı).');
 const d=p.data;
 const now=new Date().toISOString();
 const upsertSql='INSERT INTO profiles (user_id,name,grade,target,exam_year,exam_date,motto,daily_goal,school,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET name=excluded.name,grade=excluded.grade,target=excluded.target,exam_year=excluded.exam_year,exam_date=excluded.exam_date,motto=excluded.motto,daily_goal=excluded.daily_goal,school=excluded.school,updated_at=excluded.updated_at';
 await db().prepare(upsertSql).bind(user,d.name,d.grade,d.target,d.examYear,d.examDate,d.motto,d.dailyGoal,d.school,now).run();
 if(me.id&&me.id!==user){
  await db().prepare(upsertSql).bind(me.id,d.name,d.grade,d.target,d.examYear,d.examDate,d.motto,d.dailyGoal,d.school,now).run();
 }
 await db().prepare('UPDATE users SET name=? WHERE id=?').bind(d.name,me.id).run();
 const supa=activeSupabaseConfig();
 if(supa){
  await supabaseAuthUpdateProfile(supa,me.id,me.sbAccessToken,{
   name:d.name,
   grade:d.grade,
   target:d.target,
   examYear:d.examYear,
   examDate:d.examDate,
   motto:d.motto,
   dailyGoal:d.dailyGoal,
   school:d.school
  }).catch(()=>{});
 }
 const row=await db().prepare('SELECT * FROM profiles WHERE user_id=?').bind(user).first();
 return Response.json({profile:pack(row||d as any)});
}catch(e){return failure(e)}}
