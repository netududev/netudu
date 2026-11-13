import {requireUser,failure,json,AppError,bindings,youtubeReady} from '@/lib/server';
import {consume,refund} from '@/lib/limits';
import {today as serverToday,addDays} from '@/lib/study';
import {readPlan,writePlan} from '@/lib/plan/store';
import {actionSchema,ITEMS_TOTAL_MESSAGE} from '@/lib/plan/resource-schema';
import {LIMITS,itemsTotal,fitItems,applyProgress,completeToday,undoToday,makeResource,normalizeResources,parsePlaylistUrl,type Resource} from '@/lib/plan/resources';
import {PlaylistError,loadPlaylist,shouldRefund} from '@/lib/plan/playlist';
// Kaynaklar (soru bankası / oynatma listesi): ekle, düzenle, sil, ilerleme, bugünkünü bitir, liste başlıklarını getir.
// Kaynaklar plan config JSON'ında tutulur; yanıt her zaman güncel plandır (fetch-playlist hariç).
const badUrl='Geçerli bir YouTube oynatma listesi bağlantısı gir (youtube.com/playlist?list=… ya da list= içeren video bağlantısı).';
// İstemcinin yerel günü sunucu gününden en çok 1 gün sapabilir; aksi hâlde sunucu günü
const dayOf=(client?:string)=>{const s=serverToday();return client&&[addDays(s,-1),s,addDays(s,1)].includes(client)?client:s};
export async function POST(req:Request){try{const me=await requireUser(req);const user=me.tenantId||me.id;const p=actionSchema.safeParse(await json(req));if(!p.success)throw new AppError('Kaynak bilgilerini kontrol et. Ad, toplam ve günlük hedef gerekli; sayılar sınırlar içinde olmalı.');const a=p.data;
 if(a.action==='fetch-playlist'){const ref=parsePlaylistUrl(a.url);if(!ref)throw new AppError(badUrl);if(!youtubeReady())throw new AppError('Başlıkları getirmek için YouTube bağlantısı ayarlı değil. Video sayısını elle girebilirsin.',503);
  // Başlık sınırı dolmuşsa YouTube kotası harcanmaz; hak yalnız kullanıcı kaynaklı olmayan hatada iade edilir (shouldRefund); paylaşılan anahtar için kullanıcı başına günlük hak (lib/limits.ts)
  if(itemsTotal((await readPlan(user))?.config.resources||[])>=LIMITS.itemsTotal)throw new AppError(ITEMS_TOTAL_MESSAGE);
  try{await consume(me,'playlist')}catch(e){if(e instanceof AppError&&e.status===429)throw new AppError('Bugünlük liste getirme hakkın doldu; video sayısını elle gir.',429);throw e}
  try{const d=await loadPlaylist(ref.listId,bindings().YOUTUBE_API_KEY!);return Response.json({playlist:{listId:ref.listId,...d}})}catch(e){if(shouldRefund(e))await refund(me,'playlist');if(e instanceof PlaylistError)throw new AppError(e.message,e.status);throw e}}
 const plan=await readPlan(user);if(!plan)throw new AppError('Önce ders çalışma programını oluştur.',404);
 const list=plan.config.resources;const at=(id:string)=>{const i=list.findIndex(r=>r.id===id);if(i<0)throw new AppError('Kaynak bulunamadı.',404);return i};let next:Resource[]=list;let note:string|undefined;
 if(a.action==='add'){if(list.length>=LIMITS.resources)throw new AppError(`En fazla ${LIMITS.resources} kaynak ekleyebilirsin.`);const r=a.resource;let listId:string|undefined;if(r.kind==='playlist'){const ref=parsePlaylistUrl(r.url);if(!ref)throw new AppError(badUrl);listId=ref.listId}
  // Başlık bütçesi aşılırsa reddetme: başlıklar kalan bütçeye kırpılır, kalan videolar "n. video" görünür
  const items=r.kind==='playlist'?fitItems(list,r.items):undefined;if(r.kind==='playlist'&&items!.length<Math.min(r.items.length,LIMITS.items))note=`Toplam ${LIMITS.itemsTotal} başlık sınırına ulaşıldığı için yalnız ilk ${items!.length} başlık saklandı; kalan videolar "n. video" görünür.`;
  const made=makeResource({kind:r.kind,name:r.name,subject:r.subject,unit:r.kind==='book'?r.unit:undefined,total:r.total,done:r.done,perDay:r.perDay,minPerUnit:r.minPerUnit,days:r.days,listId,items},crypto.randomUUID());next=normalizeResources([...list,made]);if(next.length!==list.length+1)throw new AppError('Kaynak eklenemedi. Bilgileri kontrol et.')}
 else if(a.action==='remove'){at(a.id);next=list.filter(r=>r.id!==a.id)}
 else if(a.action==='update'){const i=at(a.id);const cur=list[i];const f=a.fields;if(f.unit&&cur.kind==='playlist')throw new AppError('Oynatma listesinin birimi değiştirilemez.');
  const merged=normalizeResources([{...cur,...f}])[0];if(!merged)throw new AppError('Kaynak bilgilerini kontrol et.');next=list.map((r,j)=>j===i?merged:r)}
 else{const i=at(a.id);const cur=list[i];const t=dayOf(a.today);let r:Resource;
  if(a.action==='complete-today')r=completeToday(cur,t);
  else if(a.action==='undo-today')r=undoToday(cur,t);
  else{if(a.op.mode==='toggle'&&cur.kind!=='playlist')throw new AppError('Video işaretleme yalnız oynatma listelerinde kullanılır.');if(a.op.mode==='toggle'&&a.op.index>cur.total)throw new AppError('Video sırası geçersiz.');r=applyProgress(cur,a.op,t)}
  next=list.map((x,j)=>j===i?r:x)}
 return Response.json({plan:await writePlan(user,{config:{...plan.config,resources:next}}),...(note?{note}:{})})}catch(e){return failure(e)}}
