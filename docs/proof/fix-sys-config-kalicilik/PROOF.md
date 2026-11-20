# KANIT — fix-sys-config-kalicilik

| Görev | Tür | Aralık | Tur | Yazar modeli |
|---|---|---|---|---|
| sys_config tablosu şemada yok: OpenAI anahtarı kalıcı olmuyor, hata görünmüyor | mantık | 54084c7..bu turun commit'i | 1 | sonnet |

## İddia
- [x] `supabase/schema.sql` `public.sys_config` tablosunu RLS açık, politikasız ve anon/authenticated REVOKE ile tanımlar (idempotent `IF NOT EXISTS`).
- [x] Supabase isteği başarısız olunca (yedek olsa bile) `supabase_query_failed` günlüğü HTTP durumu + PostgREST kodu ile yazılır; parametre değeri yazılmaz; aynı hata dakikada bir kez.
- [x] save_openai, Supabase yapılandırılmışken yazmayı yedeksiz doğrular; başarısızsa `ok:true, persisted:false` + açık Türkçe `message`; başarılıysa `persisted:true`.
- [x] OpenAI HTTP hatasında `openai_request_failed` (durum, error.code, error.type) yazılır; anahtar/istem yok; kullanıcıya dönen ileti ve kodlar değişmez.

## Önce
`node --experimental-strip-types --import ./tests/reg.mjs --test tests/sys-config.test.mjs` (üretim kodu yokken, yalnız boş `openai-log.ts` taslağı ile): 8 testin 8'i FAIL (schema.sql regex'i eşleşmedi; supabase_query_failed yazılmadı; `S.persistSysConfig is not a function`; openai_request_failed yazılmadı). Çıkış kodu 1.

## Sonra
`NODE_PATH=/opt/npm-tools/node_modules npm test` → 144 test, 144 pass, 0 fail; çıkış kodu 0.

## Test / Ölçüm
| Komut | Beklenen | Gerçek | Çıkış kodu | Sonuç |
|---|---|---|---|---|
| `npm test` (NODE_PATH=/opt/npm-tools/node_modules) | tüm testler yeşil | 144 pass / 0 fail | 0 | PASS |

## Orkestratör doğrulaması
Yazarın raporuna güvenilmedi; aşağıdakiler orkestratörce bağımsız yeniden koşuldu.
- `NODE_PATH=/opt/npm-tools/node_modules npm test` worktree'de yeniden koşuldu: 144 test, 144 pass, 0 fail, çıkış kodu 0.
- Kırmızı doğrulama: yeni `tests/sys-config.test.mjs` taban commit `54084c7` üzerinde çalıştırıldı, FAIL (çıkış kodu ≠ 0; taban `lib/supabase.ts` modülü strip-types ile yüklenemiyor ve `persistSysConfig` yok).
- Uçtan uca (sahte, durumlu Supabase; gerçek proje DEĞİL; tablolar/RLS davranışı `schema.sql`'den okunur), gerçek rota kodları, servis anahtarı:
  - Eski şema (sys_config yok): `save_openai` → `ok:true, persisted:false`, uyarı iletisi ("bu oturumda etkin, ancak kalıcı olarak kaydedilemedi…"); günlük: `supabase_query_failed GET sys_config status=404 code=PGRST205`.
  - Yeni şema (sys_config var): `persisted:true`; günlükte hata yok; sunucu yeniden başlayınca (yeni süreç, ortamda OpenAI anahtarı yok) soru çözme 200.
  - Her iki durumda günlüklerde sahte anahtar/sır dizesi yok (0 eşleşme).
- Kod incelemesi (orkestratör, yalnız okuma): diff kapsamda (şema, rota, `lib/supabase.ts`, `lib/server.ts`, `lib/openai-log.ts`, test); gömülü varsayılan Supabase anahtarı, `users`/`sessions` RLS, bellek DB kilidi, `/api/reports` değişmedi. Yeni dosyalarda gerçek sır yok (testlerde açıkça sahte değerler).
- Bilinen yan etki: `restFetch` her başarısız HTTP yanıtını yazar; beklenen 409 çakışmaları (kayıt yinelenmesi) da dakikada bir `supabase_query_failed` satırı olarak görünebilir (zararsız gürültü).

## Kapsam dışı / bilinen eksikler
- `tsc --noEmit` bu ortamda çalıştırılamadı (`@cloudflare/workers-types` ve `node` tipleri yok); tip denetimi yapılmadı.
- Rota (`save_openai`) depo testlerinde uçtan uca yok (yalnız `persistSysConfig` testli); uçtan uca akış orkestratörün geçici sahte-Supabase betiğiyle doğrulandı (depoya eklenmedi).
- Arayüz değişmedi: `settings.tsx` yanıttaki `message`'ı zaten gösteriyor (persisted:false iken de "good" tonunda).
- Canlıda tablo henüz yok: `supabase/schema.sql` Supabase SQL Editor'de çalıştırılmalı.

## Yeniden üretme
1. Bu turun commit'ini checkout et (SHA: REVIEW-<n>.md başlığı / PR head'i).
2. `NODE_PATH=/opt/npm-tools/node_modules npm test`

## Tur 2
Bulgu (REVIEW-1, ÖNEMLİ): `save_openai` yolu başarısızlıkta nedene bakmadan "sys_config tablosunu oluşturun" diyordu; canlıda anon/yayın anahtarı kullanılıyorsa tablo oluşturulsa bile yazma 401/403 (42501) ile reddedilir ve ileti yanlış çözüme yönlendirir.

**Bilinmeyen:** Canlıda hangi Supabase anahtar türünün (servis rolü / `sb_publishable_…` / `SUPABASE_ANON_KEY`) kullanıldığı bu çalışmayla bilinmiyor (kullanıcıya soruldu). Düzeltme her iki durumda doğru iletiyi verir.

### İddialar
- [x] `lib/supabase.ts` içinde saf `describeSysConfigFailure(result)` var; 404/PGRST205/42P01 → tablo oluştur iletisi.
- [x] 401/403/42501 → servis rolü anahtarı gerektiğini söyleyen ileti (tablo oluşturma önerilmez).
- [x] Diğer/ağ hatası (status yok) → genel ileti, `supabase_query_failed` günlüğüne yönlendirir.
- [x] Üç iletide de "bu oturumda etkin, yeniden başlayınca kaybolur" ve `OpenAI API (model · maske)` ön eki korunur; iletilerde anahtar/değer yok.
- [x] `persisted:true` yolu ve diğer davranışlar değişmedi.

### Önce
Yeni testler kodsuz koşuldu (`npm test`): 144 testten 143 pass, 2 FAIL (`S.describeSysConfigFailure is not a function`); anon 403/42501 `persistSysConfig` testi mevcut davranışı doğruladığı için baştan yeşil (beklenen). Çıkış kodu 1.

### Sonra
`NODE_PATH=/opt/npm-tools/node_modules npm test` → 144 test, 144 pass, 0 fail; çıkış kodu 0.

### Test
| Komut | Beklenen | Gerçek | Çıkış kodu | Sonuç |
|---|---|---|---|---|
| `npm test` (NODE_PATH=/opt/npm-tools/node_modules) | tüm testler yeşil | 144 pass / 0 fail | 0 | PASS |

### Orkestratör doğrulaması
- Orkestratör Tur 2'de `NODE_PATH=/opt/npm-tools/node_modules npm test` komutunu kendi koştu: 144 test, 144 pass, 0 fail, çıkış kodu 0.
- `git diff --stat`: yalnız `app/api/supabase/route.ts`, `lib/supabase.ts`, `tests/sys-config.test.mjs`, `docs/proof/.../PROOF.md` (65+/3-); kapsam içi, izlenmeyen dosya yok.
- Diff okundu: rota yalnız `persistSysConfig` sonucunu tutuyor ve `persisted:false` iletisini `describeSysConfigFailure` ile üretiyor; `persisted:true` yolu aynı. İletilerde anahtar/değer yok.
- Sınır: canlı anahtar türü bilinmiyor; doğrulama çevrimdışı sahte Supabase ile yapıldı.
