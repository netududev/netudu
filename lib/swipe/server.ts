// Sunucu tarafında kullanılan saf kurallar (route içinde çağrılır; route oturum + D1/R2 istediği için doğrudan sınanamaz)
import {reviewIntervals} from '../study';
// "Öğrendim, artık gösterme": tekrar döngüsünü bitmiş sayar; geçmişe satır EKLENMEZ (çözme sonucu değil, kullanıcı kararı)
export const learnedState=()=>({stage:reviewIntervals.length,next:null as string|null,reviewed:1});
// Soru fotoğrafı yalnız soru eklenirken yazılır (değişmez); kullanıcıya özel, 7 gün
export const IMAGE_CACHE_CONTROL='private, max-age=604800, immutable';
