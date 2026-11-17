// /api/videos çağrısının istemci yan etkileri. Hak koşulu sunucuyla birebir aynıdır (app/api/videos/route.ts: refresh||reject);
// otomatik yükleme ({}) hak düşmez, bildirim göstermez. Bileşen: app/study/question-dialog.tsx.
export const videoCallEffects=(o:{reject?:string;refresh?:boolean}):{consumes:boolean;toast:string|null}=>{
 const consumes=!!o.refresh||!!o.reject;
 return {consumes,toast:o.reject?'Not alındı; bu video bir daha önerilmeyecek.':o.refresh?'Video listesi yenilendi.':null}};
// Videolar sekmesi kendiliğinden yalnız bir kez yüklesin; hata sonrası yeniden mount döngüsü olmasın.
export const shouldAutoLoad=(s:{count:number;notice?:string;busy:boolean;tried:boolean}):boolean=>s.count===0&&!s.notice&&!s.busy&&!s.tried;
// Otomatik yükleme "denendi" anahtarı: soru, ders, konu ve çözüm durumu. Konu ya da çözüm durumu değişince (çözüm bitince) yeniden denenebilir.
export const autoKey=(q:{id:string;subject:string;topic:string},solved:boolean):string=>`${q.id}|${q.subject}|${q.topic}|${solved?1:0}`;
// Videolar boşken gösterilen metin; ağ hatası "bulunamadı"dan ayrıdır.
export const emptyVideosMessage=(s:{busy:boolean;notice?:string;tried:boolean;failed:boolean}):string=>s.busy?'Videolar aranıyor':s.notice?s.notice:s.failed?"Videolar yüklenemedi; Yeniden ara'yı dene.":s.tried?'Video bulunamadı. Yeniden ara düğmesini dene.':'Videolar yükleniyor.';
