# KANIT — fix-foto-depo

| Görev | Tür | Aralık | Tur | Yazar modeli |
|---|---|---|---|---|
| Supabase Storage yükleme/okuma hatalarını görünür kıl, get'i R2ObjectBody uyumlu yap | mantık | 069eb4d..bu turun commit'i | 1 | sonnet |

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
- `npm test`: 142/142, çıkış 0 (orkestratör bağımsız koştu). Gerçek Supabase ile denenmedi; yalnız taklit fetch.
(boş)

## Kapsam dışı / bilinen eksikler
- Gerçek Supabase'e bağlanılamadı; yalnız global `fetch` taklit edilerek denendi. Kullanıcının gerçek nedeni (yanlış anahtar türü, bucket yetkisi vb.) bilinmiyor; bu değişiklikten sonra "Fotoğraf depoya yazılamadı (HTTP …: …)" iletisiyle görünür olacak.
- `app/api/questions/route.ts` değişikliği için ayrı birim testi yok (route `@/lib/server` ve Next'e bağlı); yalnız kod okumayla doğrulandı. `tsc` bu ortamda tür paketleri (`@cloudflare/workers-types`, `node`) olmadığından koşturulamadı.
- `lib/memory-db.ts` bellek kovası `get` yalnız `{body}` döndürür; Supabase bağdaştırıcısı yedekten okurken bunu `arrayBuffer()`'lı nesneye çevirir, ancak memory-db.ts'e dokunulmadı.
- `delete` ve `SUPABASE_BUCKET_NAME` aynen bırakıldı (yardımcıda `STORAGE_BUCKET` aynı değerle yinelenir).

## Yeniden üretme
1. Bu turun commit'ini checkout et.
2. `ND_ZOD_PATH=/opt/npm-tools/node_modules/zod/index.js npm test`
