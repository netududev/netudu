export const maxDuration=300;
import {z} from 'zod';
import {subjects,examTypes} from '@/lib/study';
import {requireUser,db,failure,json,AppError,unpack,mine,aiReady} from '@/lib/server';
import {tryConsume} from '@/lib/limits';
import {findVideos} from '@/lib/videos';
// Konu videolarını yenile veya bir videoyu "işime yaramadı" diye işaretleyip yerine yenisini getir.
// questionId verilirse sorunun kayıtlı analizindeki video listesi de güncellenir.
export async function POST(req:Request){try{const me=await requireUser(req);const user=me.id;const p=z.object({subject:z.enum(subjects as [string,...string[]]),topic:z.string().trim().min(1).max(150),examType:z.enum(examTypes).default('TYT'),teacher:z.string().trim().max(80).optional(),reject:z.string().url().optional(),refresh:z.boolean().optional(),questionId:z.string().uuid().optional()}).safeParse(await json(req));if(!p.success)throw new AppError('Ders ve konu bilgisini kontrol et.');const d=p.data;// Yapay zekâ sıralaması günlük video hakkından düşer; hak bitmişse sezgisel sıralamaya geçilir (arama yine çalışır).
 const useAi=aiReady()&&(d.refresh||!!d.reject)?await tryConsume(me,'video'):aiReady();const result=await findVideos(user,d.examType,d.subject,d.topic,{reject:d.reject,refresh:d.refresh,useAi,teacher:d.teacher});
 let question=null;if(d.questionId){const row=await mine(d.questionId,user);let a:any={};try{a=row.analysis?JSON.parse(String(row.analysis)):{}}catch{}a.videos=result.videos;a.videoNotice=result.notice;await db().prepare('UPDATE questions SET analysis=? WHERE id=? AND user_id=?').bind(JSON.stringify(a),d.questionId,user).run();question=unpack(await mine(d.questionId,user))}
 return Response.json({...result,question})}catch(e){return failure(e)}}
