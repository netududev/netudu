// Uygulama kabuğunun saf mantığı: gezinme girdileri, sayfa başlıkları, eylem alanı ve genişlik kuralları.
// Bileşenler app/study/shell.tsx içinde; burada React ya da DOM yok (node:test ile sınanır).
import type {View} from '@/app/study/shared';

export const views:View[]=['home','program','resources','archive','report','exams','notes','settings'];
export type NavEntry={id:View;label:string};
export const planNavEntries:NavEntry[]=[{id:'home',label:'Bugün'},{id:'program',label:'Program'},{id:'resources',label:'Kaynaklar'}];
export const bookNavEntries:NavEntry[]=[{id:'archive',label:'Yanlış defteri'},{id:'report',label:'Aylık rapor'},{id:'exams',label:'Denemeler'},{id:'notes',label:'Ders notları'}];
export const settingsEntry:NavEntry={id:'settings',label:'Ayarlar'};

// Sayfa başlığı: yalnız h1 ve tek satır açıklama (kırıntı ve büyük harfli üst etiket yok)
export const headings:Record<View,{title:string;description:string}>={
 home:{title:'Bugün.',description:'Günün işi, saatlik planın ve tekrarların tek ekranda.'},
 program:{title:'Program.',description:'Okul ve sabit saatlerinle çakışmayan haftalık çalışma planın.'},
 resources:{title:'Kaynaklar.',description:'Soru bankaların ve oynatma listelerin; ilerlemen programına yerleşir.'},
 archive:{title:'Yanlış defteri.',description:'Yanlışların ders ve konuya göre tek yerde.'},
 report:{title:'Aylık rapor.',description:'Yanlışların hangi konulara çalışman gerektiğini gösterir.'},
 exams:{title:'Denemeler.',description:'Her denemeden sonra netini gir, gelişimini izle.'},
 notes:{title:'Ders notları.',description:'Konuyu seç, sınava dönük notunu hazırlat, sonra düzenle.'},
 settings:{title:'Ayarlar.',description:'Profilin, üyeliğin, programın ve yedeğin.'},
};

export type PageAction='print'|'edit-plan';
// "Yanlış ekle" tek yerde durur: üst çubuk. Burada yalnız ikincil eylemler kalır.
export function pageActions(view:View,{plan}:{plan:boolean}):PageAction[]{
 const out:PageAction[]=[];
 if(view==='archive'||view==='report')out.push('print');
 if(view==='home'&&plan)out.push('edit-plan');
 return out;
}

// Ekran başına tek kobalt: Bugün (Tamamla / Programı oluştur), Program, Kaynaklar, Aylık rapor, Denemeler, Notlar ve Ayarlar'ın kendi birincili var;
// üst çubuktaki "Yanlış ekle" yalnız Defter'de (kendi birincili olmayan tek ekran) birincil çizilir.
export function topbarAddVariant(view:View):'primary'|'secondary'{return view==='archive'?'primary':'secondary'}

export function contentWidth(view:View):'wide'|'reading'{return view==='settings'?'reading':'wide'}
