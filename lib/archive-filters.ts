// Yanlış defteri filtre panelinin saf mantığı: varsayılan ("tümü") değerler, seçili filtre sayacı, ay seçenekleri ve uyarı şeridi metni.
// Bileşen app/study/archive.tsx içindedir; burada React ya da DOM yok (node:test ile sınanır).
export const ALL_SUBJECTS='Tüm dersler',ALL_EXAMS='Tümü',ALL_STATUS='Tüm durumlar',ALL_MISTAKES='Tüm hatalar',ALL_MONTHS='Tüm aylar';
export type ArchiveFilters={subject:string;examType:string;status:string;mistake:string;month:string};
// month: '' = Tüm aylar, aksi halde YYYY-AA
export const emptyFilters:ArchiveFilters={subject:ALL_SUBJECTS,examType:ALL_EXAMS,status:ALL_STATUS,mistake:ALL_MISTAKES,month:''};

// "Filtreler" düğmesindeki rozet: varsayılandan farklı her filtre 1 sayılır (arama metni ayrı alandır, sayılmaz)
export function activeFilterCount(f:ArchiveFilters):number{
 return (f.subject!==ALL_SUBJECTS?1:0)+(f.examType!==ALL_EXAMS?1:0)+(f.status!==ALL_STATUS?1:0)+(f.mistake!==ALL_MISTAKES?1:0)+(f.month!==''?1:0);
}
export const filtersButtonLabel=(count:number)=>count>0?`Filtreler, ${count} seçili`:'Filtreler';

// Ay seçenekleri: yalnız defterde gerçekten soru olan aylar, yeniden eskiye
export const monthValues=(dates:string[]):string[]=>[...new Set(dates.filter(d=>/^\d{4}-\d{2}/.test(d)).map(d=>d.slice(0,7)))].sort().reverse();

// Kontrol bekleyenler şeridi: sayı mevcut isUnrecognized sayımından gelir; sıfırsa şerit yok
export const pendingStripText=(n:number):string|null=>n>0?`${n} sorunun dersi ya da konusu belirlenmedi`:null;
