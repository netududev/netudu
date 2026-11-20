# PROOF — fix-sys-config-hata-nedeni

Bu PR, #20'nin (birleşti, Tur 1) Tur 2 düzeltmesini ayrı PR olarak taşır. Kod, bağımsız incelemede (REVIEW-2.md) SKOR 5 almış aralıkla aynıdır (`a3aa8ab`).

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

### Yeni PR notu
Orkestratör bu dalda (origin/main = `59e76a3` üzerinde) testi yeniden koştu: 144 test, 144 pass, 0 fail, çıkış 0. Kod farkı yalnız `app/api/supabase/route.ts`, `lib/supabase.ts`, `tests/sys-config.test.mjs`.
