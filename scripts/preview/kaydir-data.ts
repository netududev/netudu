// Kaydır Çöz önizleme verisi: ÖRNEKTİR (gerçek kullanıcı verisi değildir). Hem sunucu çizimi (kaydir-entry.tsx) hem tarayıcı paketi (kaydir-client.tsx) kullanır.
import {today,addDays,type Question} from '@/lib/study';

const t=today();
const base=(i:number,o:Partial<Question>):Question=>({id:'q'+i,exam:'',exam_type:'TYT',date:addDays(t,-10+i),subject:'Matematik',topic:'Türev',question:'',my_answer:'',answer_key:'',image_key:null,analysis:null,reviewed:0,created_at:addDays(t,-10+i)+'T10:00:00Z',mistake_type:'yanlış',review_stage:1,next_review:addDays(t,-1),review_log:[],...o}) as Question;
const solved=(o:any={})=>({readable:true,subject:'',topic:'',transcription:'',answer:'B',steps:['f(x) = x³ − 3x için f′(x) = 3x² − 3 bulunur.','f′(x) = 0 denklemi x = ±1 verir.','f″(x) işaretine bakılır: x = −1 yerel maksimum, x = 1 yerel minimumdur.'],pitfall:'Türevi sıfır yapan her noktayı ekstremum sanma; işaret değişimini kontrol et.',note:'Ekstremum noktalarında birinci türev sıfırdır; ikinci türev eğriliğin yönünü söyler.',confidence:'yüksek',answerKeyMatch:true,videos:[],...o});
const long=Array.from({length:14},(_,i)=>`Adım ${i+1}: Bu soruda ${i+1}. işlem, önceki sonucu denklemde yerine koyarak sadeleştirmeyi ve işaret kontrolünü içerir; sonuç bir sonraki adıma taşınır.`);
export const sampleRows:Question[]=[
 base(0,{subject:'Matematik',topic:'Türev',image_key:'k0',my_answer:'D',answer_key:'B',analysis:solved({transcription:'f(x) = x³ − 3x fonksiyonunun yerel minimum noktası aşağıdakilerden hangisidir?'})}),
 base(1,{subject:'Fizik',topic:'Elektrik ve manyetizma',question:'Direnci 6 Ω olan bir iletkenden 3 A akım geçiyor. İletkenin uçları arasındaki potansiyel farkı kaç volttur?',my_answer:'',answer_key:'18',analysis:solved({answer:'18 V',steps:long,pitfall:'Akım ile gerilimi karıştırma; V = I · R bağıntısında R doğrudan çarpılır.',note:'Ohm yasası: Bir iletkenin uçları arasındaki potansiyel farkı, üzerinden geçen akımla doğru orantılıdır. Orantı sabiti direnç olarak adlandırılır ve sıcaklığa bağlı olarak değişebilir; bu nedenle problemlerde sıcaklığın sabit olduğu varsayılır.'})}),
 base(2,{subject:'Kimya',topic:'Mol kavramı',question:'0,2 mol Ca atomunun kütlesi kaç gramdır? (Ca: 40)',my_answer:'4',answer_key:'8',analysis:null}),
 base(3,{subject:'Biyoloji',topic:'Hücre',image_key:'k3',my_answer:'',answer_key:'C',analysis:{...solved({steps:[]}),readable:false,answer:''}}),
 base(4,{subject:'Matematik',topic:'Limit',question:'Aşağıdakilerden hangisi limit ifadesinin değeridir?',my_answer:'E',answer_key:'C',analysis:solved({answer:'C'})}),
 base(5,{subject:'Fizik',topic:'Basınç',image_key:'k5',my_answer:'A',answer_key:'D',analysis:solved({answer:'D'})}),
 base(6,{subject:'Kimya',topic:'Asit ve baz',question:'pH değeri 3 olan çözeltinin H⁺ derişimi kaçtır?',my_answer:'',answer_key:'B',next_review:addDays(t,3),review_stage:2,analysis:solved({answer:'B'})}),
];
