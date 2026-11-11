# KANIT — maarif-fiyat-mobil

| Görev | Tür | Aralık | Tur | Yazar modeli |
|---|---|---|---|---|
| Maarif adlandırması, fiyat bölümü, Apple girişi, sporun kaldırılması, gürültü temizliği, metin yenileme, mobil ve animasyon turu | karma | 9b4c3f3..bu turun commit'i | 1 | sonnet |

## İddia
- [ ] Fiyat/deneme tek dosyadan (`lib/pricing.ts`) okunuyor; metinlerde sabit "199,99" yok. (grep ve test)
- [ ] Açılışta tek plan kartı + "Fiyat" menü bağlantısı var; Ayarlar'da Üyelik kartı var ve deneme günü yalnız gerçek kayıt tarihinden hesaplanıyor. (kod okuma; görsel doğrulama YAPILAMADI)
- [ ] Apple girişi: `APPLE_*` dört değişken tanımlıysa çalışan route + `appleReady` bayrağı; düğme yalnız `appleReady` iken görünür; client_secret (ES256) ve id_token (RS256/JWKS) doğrulaması yazıldı ve yerel anahtarlarla test edildi. (gerçek Apple hesabıyla uçtan uca deneme YAPILAMADI)
- [ ] Spor sihirbazdan, programdan, ayarlardan ve açılıştan kalktı; eski `sport` alanlı kayıtlar çökmeden okunuyor. (test)
- [ ] Zamanlayıcı kenar durumları (boş gün, çakışma, gece yarısı, geçersiz saat) testli.
- [ ] Normal kullanıcıya görünen metinlerde sağlayıcı/altyapı/"Developer" ifadesi yok; yönetici bölümü `isDev` ile sınırlı.
- [ ] Mobil CSS: cascade-audit adayı 0; sabit genişlikli ızgara düzeltildi; 44px dokunma hedefi kuralı eklendi. (320–430px gerçek ekran doğrulaması YAPILAMADI)
- [ ] Animasyonlar yalnız transform/opacity; reduced-motion global kuralıyla kapanıyor. (kod okuma; tarayıcıda izleme YAPILAMADI)

## Önce
`git diff --stat` taban 9b4c3f3'te sport alanı, spor adımı ve `SPORT_PROGRAMS` vardı; Apple route'u, `lib/pricing.ts` ve fiyat bölümü yoktu (kod okumayla doğrulandı; ayrı "önce" çıktısı üretilmedi).

## Sonra
Aşağıdaki test çıktıları. Görsel çıktı (before/after.png) YAPILAMADI: bu ortamda tarayıcı ve `next build` yok.

## Test / Ölçüm
| Komut | Beklenen | Gerçek | Çıkış kodu | Sonuç |
|---|---|---|---|---|
| `node --experimental-strip-types --import <scratchpad>/t/reg.mjs <scratchpad>/t/streak.test.mjs` | 9/9 | `streak: 9/9 PASS` | 0 | PASS |
| `... t/scheduler.test.mjs` | 24 test geçer | `scheduler+pricing: 24 test geçti` (spor üretilmez, eski kayıt normalleşir, boş gün, çakışma, gece yarısı, geçersiz saat, ters pencere, dolu gün, bozuk girdi, Maarif ders adı eşlemesi, fiyat biçimi, deneme günü) | 0 | PASS |
| `... t/apple.test.mjs` | 13 test geçer | `apple: 13 test geçti` (ES256 imza doğrulanır, PEM biçimleri, id_token: geçerli / yanlış nonce / nonce yok / aud / iss / süresi geçmiş / yabancı anahtar / bilinmeyen kid / alg=none / kurcalanmış imza) | 0 | PASS |
| `node ts-check.js <değişen dosyalar>` | OK | tüm dosyalar `OK` | 0 | PASS |
| `node names-check.js <değişen dosyalar>` | tanımsız ad yok | `TEMİZ: tanımsız ad / kullanılmayan değişken-import yok` (`D1Database`/`R2Bucket` global tip uyarıları ve kullanılmayan `supabaseAuthGetUser` taban kodunda zaten vardı, süzüldü) | 0 | PASS |
| `python3 check-css.py app/globals.css` | süslü parantez farkı 0 | `açık-kapalı farkı = 0`, `( ) farkı = 0`, tanımsız değişken yalnız JS ile atanan `--d --sp --sy --v` | 0 | PASS |
| `python3 cascade-audit.py app/globals.css` | aday 0 | başlangıçta 3 aday (`.primary`, `.secondary` min-height; `.page-heading p:last-child`); sonra `toplam 0` | 0 | PASS |
| `python3 class-check.py ...` | yeni sınıflar tanımlı | tanımsız 19 sınıf (hepsi taban kodunda var: görünüm kimlikleri, `sr-only`); yeni sınıflar (`view`, `count`, `skel`, `social-stack`, `lp-plan`...) tanımlı | 0 | PASS |
| `python3 deadscan.py` | ölü sınıf yok | `352 sınıf; 12 kaynakta geçmeyen` (yalnız dinamik üretilen `tl-*`, `dot-*`, `subject-*`, `recharts-*`); `tl-sport`, `week-map`, `auth-more`, `google-button` kaldırıldı | 0 | PASS |
| `python3 palette-check.py` | ihlal yok | çıktı boş | 0 | PASS |
| `python3 contrast.py` | tüm çiftler AA | AA dışı satır yok (UI odak halkası 3,33 ≥ 3) | 0 | PASS |
| grep spor/sport | yalnız geriye uyumluluk | yalnız `scheduler.ts`/`store.ts` yorumları ve `curriculum.ts` içinde bir matematik notunda geçen "sporlar" kelimesi (müfredat içeriği, dokunulmadı) | 0 | PASS |
| grep Supabase/OpenAI/Developer (settings geliştirici bölümü hariç) | kullanıcı metni yok | yalnız yönetici için `isDev` ile sınırlı üst çubuk düğmeleri ve `loginAsDeveloper` işlev adı | 0 | PASS |
| grep fiyat (`199`, `7 gün`) | yalnız `lib/pricing.ts` | `layout.tsx` artık `priceSummary()` kullanıyor; başka sabit yok | 0 | PASS |
| grep uydurma iddia (indirim, kullanıcı sayısı, yorum, onaylı) | yok | eşleşen kullanıcı metni yok | 0 | PASS |
| `next build` | — | YAPILAMADI (bu ortamda yok) | — | YAPILAMADI |
| Tarayıcıda 320–430px görsel kontrol, animasyon izleme, Apple/Google gerçek giriş | — | YAPILAMADI | — | YAPILAMADI |

## Orkestratör doğrulaması
(Orkestratör doldurur.)

## Kapsam dışı / bilinen eksikler
- Testler önce kod, sonra yazıldı (kırmızı-önce uygulanmadı); yeni davranışlar testlerle sabitlendi.
- 112 günlük program müfredatının konu başlıkları (`lib/plan/curriculum.ts`) bu çalışmada Maarif ünite adlarıyla doğrulanmadı; yalnız ders adları `noteSubject` ile Maarif ders adlarına eşleniyor. Yanlış defteri ve ders notları konu listesi `lib/meb-topics.ts`'ten (Maarif ders programları) geliyor.
- Hafta başlıklarındaki "Problemler Kampı 1-3" ve bazı `target`/`note` alanları müfredat içeriği olduğundan değiştirilmedi.
- `app/api/auth/login/route.ts` geliştirici e-postası için şifresiz oturum açıyor (kapsam dışı, değiştirilmedi; güvenlik riski).
- Google girişi "Beni hatırla" işaretini dikkate almıyor (oturum her zaman 90 gün); e-posta girişi dikkate alıyor.
- Dosyaların tamamında satır satır metin yeniden yazımı yapılmadı: arşiv, deneme, rapor, notlar, yükleme ve soru penceresi dosyalarında ve ayarlarda belirlenen cümleler yenilendi; bazı yardımcı metinler eski hâliyle kalmış olabilir.

## Yeniden üretme
1. Bu turun commit'ini checkout et (SHA: REVIEW-<n>.md başlığı / PR head'i).
2. `node --experimental-strip-types --import <scratchpad>/t/reg.mjs <scratchpad>/t/scheduler.test.mjs` (apple ve streak için aynı).
3. `python3 <scratchpad>/cascade-audit.py app/globals.css`, `check-css.py`, `class-check.py`, `deadscan.py`, `palette-check.py`, `contrast.py`.
4. Vercel önizlemesinde `next build`, 320/375/430px görünüm ve giriş akışlarını elle dene.

## Orkestratör doğrulaması (tur 1)
- `check-css.py`: süslü parantez ve ( ) farkı 0; tanımsız yalnız `--d --sp --sy --v` (JS/satır içi).
- `ts-check.js`: değişen tüm TS/TSX dosyalarında 0 sözdizimi hatası.
- `names-check.js`: 24 uyarının 23'ü taban koddaki Cloudflare tip adları (D1Database, R2Bucket vb.), 1'i taban koddaki kullanılmayan import (`supabaseAuthGetUser`); bu değişiklikten gelen tanımsız ad yok.
- Testler: streak 9/9, scheduler+pricing 24, apple 13 — hepsi geçti.
- `cascade-audit.py`: toplam 0. `class-check.py`: tanımsız sınıf 0.
- Fiyat yalnız `lib/pricing.ts`'ten okunuyor (grep).
- Kullanıcı metni taraması: Supabase/OpenAI ifadeleri yalnız geliştirici bölümündeki ayar işlevlerinde.
- `next build`, tarayıcı/mobil görsel kontrol, gerçek Apple/Google girişi: YAPILAMADI.

## Tur 2 (inceleme turu 1 bulgularının düzeltmesi)

Orkestratör doğrulaması bu tur için boş bırakıldı; kutular işaretlenmedi.

### Düzeltmeler
1. **Maarif iddiası:** `lib/plan/curriculum.ts` not metinleri sadeleştirildi ("yeni nesil mantık soruları", "sınav soru dili", "ÖSYM'nin vazgeçmediği klasik soru modelleri", "TYT programını tamamladın."); kenar çubuğu "YKS {yıl}"; `PRODUCT.md` "Maarif TYT müfredatına göre kurulur" → "YKS konu listesine göre kurulur".
2. **Apple eşleme:** karar saf fonksiyona ayrıldı (`decideAppleAccount`, `lib/apple-auth.ts`). Şifreli (password_hash dolu) mevcut hesapta oturum açılmaz, `?auth_error=apple_email_exists` ile giriş ekranına yönlenir (`app/study/auth.tsx` authErrors: "Bu e-postayla şifreli bir hesap var. Şifrenle giriş yap."). Şifresiz hesapta eşleme serbest, hesap yoksa (kayıt açıksa) oluşturulur. Apple `user` adı `cleanAppleName` ile kontrol/bidi karakterlerinden arındırılır. Şema değişmedi. Kolon adı `password_hash`: `lib/server.ts` şeması ve `lib/auth.ts` (createUser) kullanıyor; Supabase bağdaştırıcısı (`lib/supabase.ts`, genel SELECT çevirisi satır ~632) seçilen sütunları olduğu gibi PostgREST `select=` listesine geçirir, oturum sorgusu da `password_hash` döndürür. Google callback'ine dokunulmadı (canlı davranış; orada e-posta eşleşen hesaba şifreye bakmadan `google_sub` yazılıyor, ayrı bir değerlendirme konusu).
3. **Çalışma alanı çıkışı:** `/api/tenant` herkes için çekilir. Yönetici olmayan kullanıcıda yalnız birden fazla alanı varsa ya da aktif alan kişisel alan (id = kullanıcı id) değilse "Çalışma alanı" kartı görünür: alan seçici + "Kişisel alanıma dön" (mevcut `runTenantOp` switch çağrısı). Tek alanlı kullanıcıda kart yok. Yönetim paneli `isDev` altında kaldı.
4. `trialDaysLeft` en çok 7 döner (gelecekteki createdAt → 7). 5. `normalizePlanConfig` tempo denetimi `Object.prototype.hasOwnProperty.call` (tsconfig hedefi ES2018, `Object.hasOwn` yok). 6. `.pw-field .icon-button:active` eklendi. 7. Mobil `min-height:44px` kuralı kendi düğme sınıflarıyla sınırlandı (`.text-button,.icon-button,.danger-button:not(.inline),.topic-button,.camera-button,[role=tab],summary,.choice,` sekme/segment düğmeleri); sonner, react-day-picker, switch/checkbox ve satır içi `.danger-button.inline` etkilenmez; `.primary/.secondary/.social-button` zaten 48px. 8. `.social-button` ölü ilk tanımı (`#f3f4f6`) silindi. 9. `/api/auth/me` yapay zekâ durumunu vermiyor (yeni uç eklenmedi) → madde "Yanlışlarını fotoğrafla, konuya göre sakla" oldu.

### Maarif geçen kullanıcı metinleri ve kararlar
| Yer | Bağlam | Karar |
|---|---|---|
| curriculum.ts 240/280/296/300 notları, study-app.tsx kenar çubuğu | program/kamp içeriği | düzeltildi |
| PRODUCT.md:23 | program Maarif müfredatına göre | düzeltildi |
| app/layout.tsx meta, landing.tsx:81, auth.tsx:157 | "Konu listeleri ... Maarif" | kaldı (meb-topics) |
| landing-sections.tsx:60, upload-dialog.tsx:26,32, notes.tsx:19 | konu seçimi/eşleme, ders notu | kaldı (meb-topics) |
| api/notes/route.ts:12 (yapay zekâ istemi) | ders notu | kaldı |
| lib/videos.ts:17,22,27 | video sıralama/arama | kaldı (aranan terim) |
| README.md:3,11; NET-DEFTERIM-REHBER.md; lib/topics.ts, meb-topics.ts, scheduler.ts:145, curriculum.ts:2 (yorum) | konu listesi/dokümantasyon | kaldı |
| public/ | Maarif geçmiyor | - |

### Gerçek komut çıktıları (scratchpad = /tmp/claude-0/-home-claude/ceb4c31e-2408-5fe2-8036-41d47bb14baf/scratchpad)
```
streak:            streak: 9/9 PASS                       (çıkış 0)
scheduler+pricing: scheduler+pricing: 26 test geçti       (çıkış 0)  [+ trial 7 gün, tempo 'constructor' testleri]
apple:             apple: 15 test geçti                   (çıkış 0)  [+ decideAppleAccount, cleanAppleName]
check-css.py:      süslü parantez farkı = 0; parantez farkı = 0; TANIMSIZ: ['--d','--sp','--sy','--v'] (taban; satır içi atanan değişkenler)
ts-check.js:       çıktı yok, çıkış 0
names-check.js:    TEMİZ: tanımsız ad / kullanılmayan değişken-import yok
class-check.py:    TANIMSIZ SINIF SAYISI: 0
cascade-audit.py:  toplam 0
palette-check.py:  çıktı yok, çıkış 0
```
