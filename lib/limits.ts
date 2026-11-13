// Günlük yapay zekâ hakları. Tüm kullanıcılar sunucunun OpenAI anahtarını paylaşır; masraf kontrolü için
// kişi başı günlük sınır uygulanır (Türkiye saatiyle gece yarısı yenilenir). ADMIN_EMAILS listesindekiler sınırsızdır.
import {db,bindings,AppError,type SessionUser} from './server';
import {today} from './study';
export type AiKind='solve'|'note'|'report'|'video'|'quote'|'playlist';
export const aiKinds:AiKind[]=['solve','note','report','video','quote','playlist'];
const defaults:Record<AiKind,number>={solve:20,note:3,report:2,video:15,quote:8,playlist:20};
const labels:Record<AiKind,string>={solve:'soru çözümü',note:'ders notu',report:'aylık rapor',video:'video yenileme',quote:'günün teşviki',playlist:'liste getirme'};
const envKey:Record<AiKind,'AI_LIMIT_SOLVE'|'AI_LIMIT_NOTE'|'AI_LIMIT_REPORT'|'AI_LIMIT_VIDEO'|'AI_LIMIT_QUOTE'|'AI_LIMIT_PLAYLIST'>={solve:'AI_LIMIT_SOLVE',note:'AI_LIMIT_NOTE',report:'AI_LIMIT_REPORT',video:'AI_LIMIT_VIDEO',quote:'AI_LIMIT_QUOTE',playlist:'AI_LIMIT_PLAYLIST'};
export function limitFor(kind:AiKind){const v=Number(bindings()[envKey[kind]]);return Number.isFinite(v)&&v>=0&&bindings()[envKey[kind]]!==undefined&&bindings()[envKey[kind]]!==''?Math.floor(v):defaults[kind]}
export type Usage=Record<AiKind,{used:number;limit:number}>&{unlimited:boolean};
export async function usageOf(u:SessionUser):Promise<Usage>{const rows=(await db().prepare('SELECT kind,count FROM ai_usage WHERE user_id=? AND day=?').bind(u.id,today()).all()).results as {kind:string;count:number}[];const out={unlimited:u.admin} as Usage;for(const k of aiKinds)out[k]={used:Number(rows.find(r=>r.kind===k)?.count||0),limit:limitFor(k)};return out}
// Hakkı düşer; doluysa 429 hatası verir. Atomik: sınır aşılmışsa satır güncellenmez.
export async function consume(u:SessionUser,kind:AiKind){if(u.admin)return;const lim=limitFor(kind);if(lim<=0)throw new AppError(`Bu sunucuda ${labels[kind]} kapalı.`,403);const r=await db().prepare('INSERT INTO ai_usage (user_id,day,kind,count) VALUES (?,?,?,1) ON CONFLICT(user_id,day,kind) DO UPDATE SET count=ai_usage.count+1 WHERE ai_usage.count<?').bind(u.id,today(),kind,lim).run();if(!r.meta.changes)throw new AppError(`Bugünkü ${labels[kind]} hakkın doldu (${lim}/${lim}). Hakların gece yarısı yenilenir.`,429)}
// Yapay zekâ çağrısı başarısız olursa hak geri verilir.
export async function refund(u:SessionUser,kind:AiKind){if(u.admin)return;await db().prepare('UPDATE ai_usage SET count=MAX(count-1,0) WHERE user_id=? AND day=? AND kind=?').bind(u.id,today(),kind).run().catch(()=>{})}
export async function tryConsume(u:SessionUser,kind:AiKind){try{await consume(u,kind);return true}catch{return false}}
