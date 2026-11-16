// Kaynaklar sayfasında tek kobalt eylem: ekrandaki sıradaki (önce soru bankaları, sonra oynatma listeleri) ilk bitmemiş kaynak.
import {isFinished,type Resource} from './resources';

export function leadResourceId(list:Pick<Resource,'id'|'kind'|'done'|'total'>[]):string|null{
 const shown=[...list.filter(r=>r.kind==='book'),...list.filter(r=>r.kind!=='book')];
 return shown.find(r=>!isFinished(r as Resource))?.id??null;
}
