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

// Kenar çubuğu gezinme etiketleri; "Programı oluştur" gezinme değil eylemdir (Bugün boş durumunda)
export function sidebarNavLabels(_hasPlan:boolean):string[]{return [...planNavEntries,...bookNavEntries,settingsEntry].map(e=>e.label)}

export type PageAction='print'|'edit-plan'|'add-wrong';
// "Yanlış ekle" tek yerde durur: üst çubuk. Burada yalnız ikincil eylemler kalır.
export function pageActions(view:View,{plan}:{plan:boolean}):PageAction[]{
 const out:PageAction[]=[];
 if(view==='archive'||view==='report')out.push('print');
 if(view==='home'&&plan)out.push('edit-plan');
 return out;
}

// Ekran başına tek birincil: ekranın kendi birincil eylemi varsa (program yokken Bugün/Kaynaklar'daki "Programı oluştur", Notlar'daki "Notu hazırla")
// üst çubuktaki "Yanlış ekle" ikincil çizilir; diğer ekranlarda üst çubuk birincilin tek yeridir.
export function topbarAddVariant(view:View,hasPlan:boolean):'primary'|'secondary'{return (!hasPlan&&(view==='home'||view==='resources'))||view==='notes'?'secondary':'primary'}

export function contentWidth(view:View):'wide'|'reading'{return view==='settings'?'reading':'wide'}

export type MobileBarItem={id:'home'|'program'|'add'|'archive'|'more';label:string};
export const mobileBarItems:MobileBarItem[]=[{id:'home',label:'Bugün'},{id:'program',label:'Program'},{id:'add',label:'Yanlış ekle'},{id:'archive',label:'Defter'},{id:'more',label:'Daha fazla'}];
