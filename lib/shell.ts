// Uygulama kabuğunun saf mantığı: gezinme girdileri, sayfa başlıkları, eylem alanı ve genişlik kuralları.
// Bileşenler app/study/shell.tsx içinde; burada React ya da DOM yok (node:test ile sınanır).
import type {View} from '@/app/study/shared';

export const views:View[]=['home','flex','program','resources','archive','report','exams','notes','settings','swipe'];
export type NavEntry={id:View;label:string};
export const planNavEntries:NavEntry[]=[{id:'home',label:'Bugün'},{id:'flex',label:'Görev planı'},{id:'program',label:'Program'},{id:'resources',label:'Kaynaklar'}];
export const bookNavEntries:NavEntry[]=[{id:'archive',label:'Yanlış defteri'},{id:'swipe',label:'Kaydır Çöz'},{id:'report',label:'Aylık rapor'},{id:'exams',label:'Denemeler'},{id:'notes',label:'Ders notları'}];
export const settingsEntry:NavEntry={id:'settings',label:'Ayarlar'};

// Sayfa başlığı: yalnız h1 ve tek satır açıklama (kırıntı ve büyük harfli üst etiket yok)
export const headings:Record<View,{title:string;description:string}>={
 home:{title:'Bugün.',description:'Günün işi, saatlik planın ve tekrarların tek ekranda.'},
 flex:{title:'Görev planı.',description:'Saat yok: sınıfına, eksiklerine ve netlerine göre günlük yapılacaklar. İstediğin gibi düzenle.'},
 program:{title:'Program.',description:'Okul ve sabit saatlerinle çakışmayan haftalık çalışma planın.'},
 resources:{title:'Kaynaklar.',description:'Soru bankaların ve oynatma listelerin; ilerlemen programına yerleşir.'},
 archive:{title:'Yanlış defteri.',description:'Yanlışların ders ve konuya göre tek yerde.'},
 report:{title:'Aylık rapor.',description:'Yanlışların hangi konulara çalışman gerektiğini gösterir.'},
 exams:{title:'Denemeler.',description:'Her denemeden sonra netini gir, gelişimini izle.'},
 notes:{title:'Ders notları.',description:'Konuyu seç, sınava dönük notunu hazırlat, sonra düzenle.'},
 settings:{title:'Ayarlar.',description:'Profilin, üyeliğin, programın ve yedeğin.'},
 swipe:{title:'Kaydır Çöz.',description:'Yanlışlarını tek tek kaydır, çözümü gör, tekrar takvimin kendiliğinden ilerlesin.'},
};

export type PageAction='month'|'print'|'edit-plan'|'add-exam';
// "Yanlış ekle" tek yerde durur: üst çubuk. Burada yalnız ikincil eylemler kalır.
export function pageActions(view:View,{plan}:{plan:boolean}):PageAction[]{
 const out:PageAction[]=[];
 // Defter'de "Yazdır / PDF" "Dışa aktar" menüsündedir; başlıkta yalnız Aylık rapor'da kalır
 // Aylık rapor: ay seçici (ikincil) "Yazdır / PDF"in yanında; Denemeler: tek birincil "Deneme ekle"
 if(view==='report')out.push('month','print');
 if(view==='exams')out.push('add-exam');
 if(view==='home'&&plan)out.push('edit-plan');
 return out;
}

// Ekran başına tek kobalt: Bugün (Tamamla / Programı oluştur), Program, Kaynaklar, Aylık rapor, Denemeler, Notlar ve Ayarlar'ın kendi birincili var;
// üst çubuktaki "Yanlış ekle" yalnız Defter'de (kendi birincili olmayan tek ekran) birincil çizilir.
// Defter boşken (yüklenme bitmiş, satır yok) birincil boş durumdaki "İlk yanlışını ekle"dir; üst çubuk düğmesi ikincil olur.
export function topbarAddVariant(view:View,{rows,loading}:{rows:number;loading:boolean}={rows:1,loading:false}):'primary'|'secondary'{
 if(view!=='archive')return 'secondary';
 return !loading&&rows===0?'secondary':'primary';
}

export function contentWidth(view:View):'wide'|'reading'{return view==='settings'?'reading':'wide'}
