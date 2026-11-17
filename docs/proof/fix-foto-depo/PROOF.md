# KANIT — fix-foto-depo

| Görev | Tür | Aralık | Tur | Yazar modeli |
|---|---|---|---|---|
| Supabase Storage yükleme/okuma hatalarını görünür kıl, get'i R2ObjectBody uyumlu yap | mantık | 069eb4d..bu turun commit'i | 2 | sonnet |

## İddia
- [ ] `put` Supabase yanıtı başarısızsa (403/400/500, ağ hatası, bucket oluşturulamadı) StorageError (502) fırlatır; POST /api/questions bunu AppError(502) olarak döndürür ve DB insert'i yapılmaz (put insert'ten önce çağrılır).
- [ ] Hata iletisi: kısa Türkçe metin + HTTP durumu + en çok 200 karakter ayrıntı; anahtar/URL sızmaz; günlük etiketi `supabase_storage_failed`.
- [ ] Bucket yoksa (404 / 400 "Bucket not found") oluşturulur ve yükleme bir kez tekrarlanır; `bucketChecked` yalnız bucket var/oluşturulmuşsa dolar.
- [ ] `get` başarıda `arrayBuffer()`, `body`, `httpMetadata.contentType`, `size` olan nesne döndürür (gövde bir kez okunur); 404/400/hata/ağ hatasında null (yedek varsa yedekten, `arrayBuffer()` ile).

## Önce
Yeni test, yardımcı modül yokken: `node --experimental-strip-types --import ./tests/reg.mjs tests/supabase-storage.test.mjs` → `ERR_MODULE_NOT_FOUND ... lib/supabase-storage.ts` (kırmızı). Eski `lib/supabase.ts` kodunda `put` yanıt durumuna bakmıyor, `get` yalnız `{body}` döndürüyordu (kod okuma).

## Sonra
`tests/supabase-storage.test.mjs`: 17 test geçti (put 200/403/400/500/ağ/200 karakter sınırı/bucket 404 ve 400 tekrar/bucket oluşturma hatası/bucket önbelleği; get 200/404/400/500/ağ/yedek).

## Test / Ölçüm
| Komut | Beklenen | Gerçek | Çıkış kodu | Sonuç |
|---|---|---|---|---|
| `ND_ZOD_PATH=/opt/npm-tools/node_modules/zod/index.js npm test` | hepsi yeşil | 142 test, 142 geçti, 0 kalan | 0 | PASS |

## Orkestratör doğrulaması
- Tur 2 sonrası `npm test`: 143/143, çıkış 0 (orkestratör bağımsız koştu). Gerçek Supabase ile denenmedi; yalnız taklit fetch.
- `npm test`: 142/142, çıkış 0 (orkestratör bağımsız koştu). Gerçek Supabase ile denenmedi; yalnız taklit fetch.
(boş)

## Kapsam dışı / bilinen eksikler
- Gerçek Supabase'e bağlanılamadı; yalnız global `fetch` taklit edilerek denendi. Kullanıcının gerçek nedeni (yanlış anahtar türü, bucket yetkisi vb.) bilinmiyor; bu değişiklikten sonra "Fotoğraf depoya yazılamadı (HTTP …: …)" iletisiyle görünür olacak.
- `app/api/questions/route.ts` değişikliği için ayrı birim testi yok (route `@/lib/server` ve Next'e bağlı); yalnız kod okumayla doğrulandı. `tsc` bu ortamda tür paketleri (`@cloudflare/workers-types`, `node`) olmadığından koşturulamadı.
- (Tur 1 notu, Tur 2'de giderildi: memory-db `get` ve `SUPABASE_BUCKET_NAME` çift tanımı.) `delete` aynen bırakıldı.

## Tur 2
Tur 1 incelemesi SKOR 3: engelleyici bir gerileme + belgelenmemiş davranış değişikliği + küçük bulgular.

### İddia (Tur 2)
- [ ] ENGELLEYİCİ: `ensureBucket` artık hiç fırlatmaz (string döner: oluşturma başarısızsa kısa maskeli ayrıntı). Bucket GET 400 + oluşturma 403 + yükleme 200 => başarılı. Oluşturma 403 + yükleme 403 => StorageError, mesaj yükleme hatasıdır (oluşturma ayrıntısı yalnız ek not). Tekrar yolundaki (yükleme 404 => oluştur => tekrar) oluşturma hatası yükleme hatasını gölgelemez.
- [ ] route: ağ hatası ve Supabase 5xx => 502, Supabase 4xx => 424 (`storageErrorToApp`, saf). `app/study/shared.tsx` yalnız 502/503/504'ü yeniden dener; 424 denenmez (8 MB görsel tekrar tekrar gönderilmez).
- [ ] bellek kovası `get` artık `toObjectBody` ile arrayBuffer/body/httpMetadata/size döndürür.
- [ ] `SUPABASE_BUCKET_NAME = STORAGE_BUCKET` (döngüsel import yok: `supabase-storage.ts` hiçbir şey import etmez). `scrub` proje ref'ini (URL'nin ilk etiketi, >=8 karakter) tam host olmadan da maskeler. `putObject` değer türü `Uint8Array|ArrayBuffer|string`. `bodyUsed:false` sabiti kaldırıldı.

### Önce (davranışsal)
- Yeni testler Tur 1 koduna karşı koşuldu (kırmızı): "bucket GET 400 + oluşturma 403 + yükleme 200" `Fotoğraf deposu (bucket) oluşturulamadı (HTTP 403: ...)` fırlatarak düştü (gerileme yeniden üretildi); oluşturma ağ hatası + yükleme 200 aynı şekilde düştü; `upstream`, proje-ref maskesi, `storageErrorToApp`, `bodyUsed` testleri de düştü (8 kırmızı).
- `tests/memory-bucket.test.mjs` eski `get` ile (HEAD'deki memory-db.ts geçici geri konup) `TypeError: o.arrayBuffer is not a function` verdi; düzeltmeden sonra geçti.

### Sonra
- `tests/supabase-storage.test.mjs`: 25 test geçti (Tur 1'de 17). Yeni: 403/ağ oluşturma hatasında yükleme denenir; oluşturma+yükleme 403 => yükleme mesajı; tekrar yolu gölgeleme yok; 409 önbelleğe alır; `upstream` null/durum; proje-ref maskesi; `storageErrorToApp` (null/5xx => 502, 400/403/404/413 => 424, StorageError dışı => null); shared.tsx kaynak taraması (koşul tam `[502,503,504]`).
- `tests/memory-bucket.test.mjs`: yeni (memory-db.ts "parameter property" içerdiği için strip-only modda yüklenmez; test alt süreçte `--experimental-transform-types` ile koşar).
- `ND_ZOD_PATH=/opt/npm-tools/node_modules/zod/index.js npm test`: 143 test, 143 geçti, 0 kalan, çıkış 0.
- route'un kendisi (`app/api/questions/route.ts`) için birim testi YOK: `@/lib/server`, Next ve Cloudflare bağlamına bağlı. Yalnız hata dönüştürme mantığı saf `storageErrorToApp`'a çıkarılıp test edildi; route'taki tek satırlık bağ (`storageErrorToApp(e)` => `AppError(message,status)`) kod okumayla doğrulandı. `tsc` yine koşturulamadı (tür paketleri yok).

### Kapsam dışı / Davranış değişikliği (kasıtlı)
- Supabase'e yapılandırıldığında başarısız yükleme KULLANICIYA GÖRÜNÜR HATA olarak kalır; bellek yedeğine sessiz yazma YOKTUR (serverless bellek örnekler arası paylaşılmaz, sessiz yedek "yüklendi" yanılsaması verirdi). Eski kod yüklemeyi yutup belleğe yazıyordu.
- Ortam değişkeni yoksa `lib/supabase.ts` gömülü publishable anahtarla Supabase'e gider; Storage INSERT politikası yoksa yükleme hata verir (502 ağ/5xx, 424 Supabase 4xx).
- Kullanıcının canlı anahtar türü BİLİNMİYOR. Kullanıcıya sorulacak: `service_role` / `sb_secret_` mı, `sb_publishable_`/anon mı? Publishable/anon ise `question-images` bucket'ı panelden açılmalı ve `storage.objects` için INSERT (ve okuma için SELECT) politikası gerekir.
- Gerçek Supabase ile denenmedi; yalnız taklit fetch.

## Yeniden üretme
1. Bu turun commit'ini checkout et.
2. `ND_ZOD_PATH=/opt/npm-tools/node_modules/zod/index.js npm test`
