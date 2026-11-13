// YouTube Data API v3 playlistItems ile oynatma listesi başlıkları (yalnız sunucu tarafı; anahtar istemciye gitmez).
// Anahtar ve ağ dışarıdan verilir: bu modül framework/ortam bilmez, sahte fetch ile test edilir.
import {LIMITS,LIST_ID,VIDEO_ID,type PlaylistItem} from './resources';
export class PlaylistError extends Error{status:number;constructor(message:string,status=502){super(message);this.status=status}}
// Hak iadesi: kullanıcı kaynaklı hatalar (geçersiz/yok/özel liste: 400, 404) YouTube kotası harcadığı için hak da harcanır; ağ, zaman aşımı ve YouTube 5xx/403 (502 eşlemesi) iade edilir.
export const shouldRefund=(e:unknown)=>!(e instanceof PlaylistError&&(e.status===400||e.status===404));
type Fetcher=(url:string,init?:RequestInit)=>Promise<Response>;
// Listeyi sayfalayarak okur: en çok 300 öğe, her istek 15 sn zaman aşımı. total = YouTube'un bildirdiği toplam (en çok 2000).
export async function loadPlaylist(listId:string,key:string,doFetch:Fetcher=fetch):Promise<{items:PlaylistItem[];total:number}>{
 if(!LIST_ID.test(listId))throw new PlaylistError('Oynatma listesi kimliği geçersiz.',400);
 const items:PlaylistItem[]=[];let token='';let total=0;
 for(let page=0;page<8&&items.length<LIMITS.items;page++){
  const u=new URL('https://www.googleapis.com/youtube/v3/playlistItems');u.search=new URLSearchParams({part:'snippet',maxResults:'50',playlistId:listId,...(token?{pageToken:token}:{}),key}).toString();
  let r:Response;try{r=await doFetch(u.toString(),{signal:AbortSignal.timeout(15000)})}catch{throw new PlaylistError('YouTube şu an yanıt vermedi. Video sayısını elle girebilirsin.')}
  if(r.status===404)throw new PlaylistError('Oynatma listesi bulunamadı. Bağlantıyı ve listenin herkese açık olduğunu kontrol et.',404);
  if(!r.ok)throw new PlaylistError(r.status===403||r.status===400?'YouTube bu isteği kabul etmedi. Video sayısını elle girebilirsin.':'YouTube listeyi getiremedi. Video sayısını elle girebilirsin.');
  const j=await r.json() as {items?:any[];nextPageToken?:string;pageInfo?:{totalResults?:number}};
  total=Number(j.pageInfo?.totalResults)||total;
  for(const it of j.items||[]){const id=it?.snippet?.resourceId?.videoId;if(typeof id==='string'&&VIDEO_ID.test(id)&&items.length<LIMITS.items)items.push({id,title:String(it.snippet.title||'').slice(0,LIMITS.title)})}
  token=j.nextPageToken||'';if(!token)break}
 if(!items.length)throw new PlaylistError('Bu listede video bulunamadı. Video sayısını elle girebilirsin.',404);
 return {items,total:Math.min(LIMITS.total,Math.max(total,items.length))}}
