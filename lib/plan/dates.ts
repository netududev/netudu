// Takvim yardımcıları (YYYY-MM-DD, öğlen UTC ile saat dilimi kaymasından bağımsız). scheduler.ts dışa aktarır; resources.ts döngüsüz kullanır.
import {ALL_DAYS,type DayKey} from './curriculum';
export function addDays(date:string,days:number){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10)}
export function daysBetween(from:string,to:string){return Math.round((Date.parse(to+'T12:00:00Z')-Date.parse(from+'T12:00:00Z'))/86400000)}
export function dayKeyOf(date:string):DayKey{const js=new Date(date+'T12:00:00Z').getUTCDay();return ALL_DAYS[js===0?6:js-1]}
