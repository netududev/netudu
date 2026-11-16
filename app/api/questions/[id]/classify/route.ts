import {requireUser,mine,db,respond,AppError,failure,unpack,stripFence,imageDataUrl,aiReady,type SessionUser} from '@/lib/server';
import {consume,refund} from '@/lib/limits';
import {classifyInstructions,parseClassification,readClassification,withClassification} from '@/lib/classify';
// Soru fotoğrafını yapay zekâyla sınıflandırır (ders, sınav, konu, alt konu, zorluk, güven). Çözümden bağımsız ve ucuzdur:
// kısa JSON çıktı, düşük token sınırı. Yapay zekâ kapalıysa ya da günlük hak bittiyse soru olduğu gibi kalır (hata değil, atlandı).
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){let charged:SessionUser|null=null;let done=false;try{const me=await requireUser(req);const user=me.tenantId||me.id;const id=(await params).id;const row=await mine(id,user);
 const skip=(reason:string)=>Response.json({question:unpack(row),status:'skipped',reason});
 let a:any=null;try{a=row.analysis?JSON.parse(String(row.analysis)):null}catch{}
 if(readClassification(a)?.source==='manual')return skip('Elle düzenlendi.');
 if(a?.readable)return skip('Soru zaten çözüldü; ders ve konu çözümden gelir.');
 if(!row.image_key)throw new AppError('Tanıma için soru fotoğrafı gerekli.');
 if(!aiReady())return skip('Yapay zekâ şu an kapalı. Ders ve konuyu elle seçebilirsin.');
 try{await consume(me,'classify');charged=me}catch(e){if(e instanceof AppError&&(e.status===429||e.status===403))return skip(e.message);throw e}
 const url=await imageDataUrl(String(row.image_key),String(row.mime||'image/jpeg'));if(!url)throw new AppError('Soru fotoğrafı bulunamadı.',404);
 const r=await respond([{role:'user',content:[{type:'input_text',text:JSON.stringify({sinavTuru:row.exam_type})},{type:'input_image',image_url:url,detail:'auto'}]}],classifyInstructions(),false,{maxTokens:400,timeoutMs:45000});
 let value:unknown=null;try{value=JSON.parse(stripFence(r.text))}catch{}
 const out=parseClassification(value,{subject:String(row.subject),examType:String(row.exam_type)});
 await db().prepare('UPDATE questions SET subject=?,topic=?,exam_type=?,analysis=? WHERE id=? AND user_id=?').bind(out.subject,out.topic,out.examType,withClassification(row.analysis?String(row.analysis):null,out.classification),id,user).run();done=true;
 return Response.json({question:unpack(await mine(id,user)),status:out.classification.needsReview?'review':'ok',reason:out.classification.reason})}catch(e){return failure(e)}finally{if(charged&&!done)await refund(charged,'classify')}}
