# REVIEW-1 — PR #20, aralık `54084c7..0e997d8`

İnceleyici: claude-opus-5-5 (Fable kredi hatasıyla erişilemedi; kuraldaki yedek model).

SKOR: 4
KARAR: DUZELTME_GEREKLI
INCELEYICI_MODEL: claude-opus-5-5 (Opus 5.5; Fable erişilemediği için yedek)
GUCLU_YANLAR:
- lib/supabase.ts:113-116 `postgrestCode` gövdeyi `res.clone().json()` ile okuyor, asıl gövde tüketilmiyor. Çağıran `executeOnSupabase` (lib/supabase.ts:731-735) hâlâ `r.text()` ile 409/23505 algılıyor; UNIQUE akışları bozulmuyor. 144/144 test bunu doğruluyor (kendim koştum, çıkış kodu 0).
- lib/supabase.ts:121-128 `restFetch` günlüğünde `path.split('?')[0]` kullanılıyor; sorgu dizesindeki değerler günlüğe girmiyor. PostgREST `code` ve OpenAI `code`/`type` beyaz listeyle temizleniyor (lib/supabase.ts:115, lib/openai-log.ts:3). OpenAI `error.message` hiç yazılmıyor.
- lib/supabase.ts:735 ve 816/840/861: PostgREST `details` içerebilen UNIQUE hata iletisi `logSupabaseMiss` çağrılmadan önce yeniden fırlatılıyor; değer sızıntısı yok.
- lib/supabase.ts:136-144 `persistSysConfig` yedeksiz, doğrudan PostgREST upsert yapıyor; ağ hatasında `ok:false`; değer sonuca girmiyor.
- supabase/schema.sql:249-256 idempotent; politika yok, anon/authenticated erişemiyor; service_role RLS'i aşıyor.
- lib/server.ts:214 kullanıcıya dönen ileti ve durum kodları değişmemiş.
- lib/supabase.ts:799-804 yapıcı değişikliği davranışı koruyor.
ENGELLEYICI:
- YOK
ONEMLI:
- app/api/supabase/route.ts:229 ve 245 — `persistSysConfig` `status`/`code` döndürüyor ama rota yalnız `.ok` kullanıyor; uyarı iletisi her hatada "sys_config tablosunu oluşturun" diyor. Koda gömülü varsayılan anahtar `sb_publishable_…` (lib/supabase.ts:55), yani anon rolü; `SUPABASE_ANON_KEY`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` yedekleri de anon rolüne düşüyor (lib/supabase.ts:76). Bu PR aynı tabloda anon için `REVOKE ALL` yapıyor (schema.sql:255). — Canlı ortam service_role anahtarı değil de varsayılan veya anon anahtarla çalışıyorsa tablo oluşturulsa bile yazma 401/403 (42501) ile reddedilir; `persisted` hep false kalır ve ileti operatörü yanlış çözüme yönlendirir; soğuk başlangıçta 503 sürer. PROOF'taki uçtan uca doğrulama yalnız "servis anahtarı" ile yapılmış. — Düzeltme: route.ts:229'da sonucun tamamını tut; 404/PGRST205 için "tabloyu oluşturun", 401/403/42501 için "SUPABASE_SERVICE_ROLE_KEY (veya sb_secret) gerekli", diğer durumlar için genel ileti ver. Anon/publishable anahtarla 403 durumunu kapsayan bir test ekle ve canlıda hangi anahtar türünün kullanıldığını PROOF'ta belirt.
KUCUK:
- lib/supabase.ts:121-128 ve 790-795 — Başarısız bir Supabase isteği iki ayrı `supabase_query_failed` satırı üretiyor; beklenen 409'lar da hata olarak düşüyor. Gürültü.
- lib/supabase.ts:98-107 — `logOnce` haritası örnek başına; 200'ü aşınca tümü temizleniyor; yorumla belgelenmeli.
- app/api/supabase/route.ts:240-246 — `persisted:false` iletisi arayüzde "good" tonunda gösteriliyor.
- app/api/supabase/route.ts:206-219 ve 222-230 — Supabase'e aynı değerler iki kez yazılıyor (batch + persistSysConfig); batch adımı Supabase için gereksiz.
GEREKCE: Şema, günlükleme ve doğrulama doğru ve sızıntısız; gövde okuma, UNIQUE akışı ve yapıcı davranışı korunuyor. Testler 144/144 yeşil. Tek önemli açık: hata nedeni ayrıştırılmıyor ve kanıt yalnız service_role anahtarını kapsıyor.
