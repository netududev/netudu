// Program ekranının mobil gün sekmesi: hangi günün kartı görünür (saf mantık; React yok)
export type DayPick={week:number;idx:number}|null;

// Seçim yalnız seçildiği haftada geçerlidir (kimlik = hafta): hafta değişince bugünün sırasına, bugün o haftada değilse 0'a döner.
// Durum render sırasında türetilir; hafta değişince sıfırlamak için efekt gerekmez.
export function dayIndexFor(dates:string[],today:string,pick:DayPick,week:number):number{
 if(pick&&pick.week===week&&Number.isInteger(pick.idx)&&pick.idx>=0&&pick.idx<dates.length)return pick.idx;
 const t=dates.indexOf(today);return t>=0?t:0;
}
