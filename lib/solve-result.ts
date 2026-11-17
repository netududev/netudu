import type {Video} from './study';
// Çözüm sonucunu kaydedilecek analize çevirir. Video araması ve konu geçmişi çözme isteğinde YAPILMAZ:
// videolar Videolar sekmesinde (AutoVideos -> /api/videos), geçmiş sayısı istemcide hesaplanır.
// Aynı soru yeniden çözülür ve ders+konu (önceki analizdeki, yoksa satırdaki) değişmediyse önceki videolar korunur; değiştiyse temizlenir (AutoVideos yeniden yükler).
export function buildCombined<A extends {readable:boolean}>(analysis:A,subject:string,topic:string,verification:string,classification:unknown,prev:unknown,row?:{subject?:unknown;topic?:unknown}){
  const p=prev&&typeof prev==='object'?prev as {subject?:unknown;topic?:unknown;videos?:unknown;videoNotice?:unknown}:null;
  // /api/videos analizi subject/topic OLMADAN yazar; aramayı soru satırının ders+konusuyla yaptığı için o durumda satır değerleri karşılaştırılır.
  const hasKey=!!p&&typeof p.subject==='string'&&typeof p.topic==='string';
  const ps=hasKey?p!.subject:row?.subject,pt=hasKey?p!.topic:row?.topic;
  const same=analysis.readable&&!!p&&typeof ps==='string'&&typeof pt==='string'&&ps===subject&&pt===topic;
  const videos:Video[]=same&&Array.isArray(p!.videos)?p!.videos as Video[]:[];
  const notice=same&&typeof p!.videoNotice==='string'?p!.videoNotice:'';
  return {...analysis,subject,topic,videos,...(notice?{videoNotice:notice}:{}),verification,...(classification?{classification}:{})};
}
