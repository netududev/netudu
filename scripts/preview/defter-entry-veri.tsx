// Defter/yükleme/etiket önizlemeleri için örnek veri (bileşen içermez; hem önce hem sonra girişi kullanır). Veriler ÖRNEKTİR.
import type {Question} from '@/lib/study';
import {rows} from './shell-entry';
const px=(c:string)=>'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="90" height="120"><rect width="90" height="120" fill="${c}"/><path d="M12 30h66M12 48h50M12 66h58M12 84h40" stroke="#8a8a8a" stroke-width="3"/></svg>`);
export const shots=(n:number,status:any='bekliyor')=>Array.from({length:n},(_,i)=>({id:'u'+i,file:{name:'soru'+(i+1)+'.jpg',size:182000+i*1000} as any,preview:px(['#efefef','#e4e4e4','#f5f5f5'][i%3]),status}));
const pendingRow=(i:number)=>({...rows[i],id:'p'+i,topic:'Konu belirlenmedi',analysis:{classification:{needsReview:true,confidence:0,source:'none',subtopic:'',difficulty:''}}}) as any;
export const pendingRows=[...rows,pendingRow(0),pendingRow(1)] as Question[];
export const tagItems=(busy=false)=>{
 const q=(i:number)=>({...rows[i],analysis:{readable:true,classification:{needsReview:false,confidence:.9,source:'ai',subtopic:'Zincir kuralı',difficulty:'orta'}}}) as any;
 return [{...shots(1)[0],id:'t0',status:'hazır',question:q(0)},{...shots(1)[0],id:'t1',status:'kontrol',question:{...rows[1],topic:'Konu belirlenmedi',analysis:{classification:{needsReview:true,confidence:.3,source:'ai',subtopic:'',difficulty:'',reason:'Konu net belirlenemedi; bir göz at.'}}}},{...shots(1)[0],id:'t2',status:'hazır',question:q(2)},{...shots(1)[0],id:'t3',status:busy?'tanınıyor':'hata',message:'Bağlantı koptu.'}] as any;
};
