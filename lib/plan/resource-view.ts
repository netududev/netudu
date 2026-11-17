// Kaynaklar sayfasında tek kobalt eylem: ekrandaki sırada (önce soru bankaları, sonra oynatma listeleri) bugün işi bekleyen ilk kaynak.
// Bugün işi kalmamışsa ilk bitmemiş kaynak (id null olmaz); o kart bekleyen iş olmadığından birincil eylem değil, yalnız ikincil "Geri al" çizer (bilinçli).
// Hepsi bitmişse (ya da liste boşsa) null.
import {isFinished,unitsFor,type Resource} from './resources';

export function leadResourceId(list:Resource[],today:string,todayOff=false):string|null{
 const shown=[...list.filter(r=>r.kind==='book'),...list.filter(r=>r.kind!=='book')].filter(r=>!isFinished(r));
 const waiting=shown.find(r=>{const u=unitsFor(r,today,today,todayOff);return !!u&&!u.done});
 return (waiting??shown[0])?.id??null;
}
