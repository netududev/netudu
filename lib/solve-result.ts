import type {Video} from './study';
// Çözüm sonucunu kaydedilecek analize çevirir. Video araması ve konu geçmişi çözme isteğinde YAPILMAZ:
// videolar Videolar sekmesinde (AutoVideos -> /api/videos), geçmiş sayısı istemcide hesaplanır.
// Aynı soru yeniden çözülür ve ders+konu değişmediyse önceki videolar korunur; değiştiyse temizlenir (AutoVideos yeniden yükler).
export function buildCombined<A extends {readable:boolean}>(analysis:A,subject:string,topic:string,verification:string,classification:unknown,prev:unknown){
  const p=prev&&typeof prev==='object'?prev as {subject?:unknown;topic?:unknown;videos?:unknown;videoNotice?:unknown}:null;
  const same=analysis.readable&&!!p&&p.subject===subject&&p.topic===topic;
  const videos:Video[]=same&&Array.isArray(p!.videos)?p!.videos as Video[]:[];
  const notice=same&&typeof p!.videoNotice==='string'?p!.videoNotice:'';
  return {...analysis,subject,topic,videos,...(notice?{videoNotice:notice}:{}),verification,...(classification?{classification}:{})};
}
