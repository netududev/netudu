# KANIT — satis-odakli-tasarim

| Görev | Tür | Aralık | Tur | Yazar modeli |
|---|---|---|---|---|
| Satış odaklı yeniden tasarım: açılış, giriş/kayıt, uygulama kabuğu, Bugün, ilk kazanım akışı | görsel | b97e5e2..bu turun commit'i | 1 | sonnet |

## İddia
- [ ] Açılış sayfası Hero → Üç adım → Üç fayda → kapanış CTA'sına indi; tek birincil CTA ("Programını oluştur"), her CTA aynı fiil ve aynı hedef (kayıt).
- [ ] CTA altındaki tek mikro-metin ("dört kısa adım") kodla doğrulanabilir: sihirbaz `steps` dizisi 4 öğe (Sabit düzen, Spor, Tempo, Başlangıç).
- [ ] Kodda karşılığı olmayan iddia eklenmedi (fiyat, "ücretsiz", "kredi kartı gerekmez", kullanıcı sayısı, yorum, başarı oranı). Kayıt ekranındaki eski "Ücretsiz…" ve "Bir dakikada hazır. Kredi kartı gerekmez." metinleri kaldırıldı.
- [ ] Üst çubuktaki Supabase/OpenAI durum rozetleri yalnız `user.developer` için görünür; bilgi Ayarlar'da duruyor.
- [ ] Bugün ekranı tek odaklı: selamlama + sıradaki ders + gerçek veriden günün ilerleme halkası; tamamlanınca şampanya tonlu ödül anı (CSS). Seri yalnız `plan.done` tamamlanma tarihlerinden hesaplanır ve ≥2 günse gösterilir.
- [ ] Boş durum ("Henüz programın yok") tek başlık + tek cümle + tek CTA; metinle düğme arası ≥28px.
- [ ] Sihirbazda "Adım n / 4" + ilerleme çubuğu; program ilk kez oluşunca Bugün'de tek seferlik "Programın hazır." anı.
- [ ] Renk kuralı: palet dışı kromatik hex yok (yalnız mevcut jetonlar; Google logosu SVG'si ve hata kırmızısı önceden vardı).
- [ ] Ölü CSS temizlendi: kaynakta karşılığı kalmayan tüm sınıf kuralları silindi (kalan 13 sınıf dinamik/kütüphane adıdır).
- [ ] API, veri akışı ve işlev değişmedi.

## Önce
Görsel önce/sonra ekran görüntüsü ALINAMADI (YAPILAMADI: bu ortamda tarayıcı/`next build` yok). "Önce" durumu `git show b97e5e2:<dosya>` ile okunabilir; özet:
- Açılış: hero + sekmeli tur + 6 kutulu özellik panosu + 3 adımlı dikey akış + ayrı 3 adım şeridi (7 bölüm), 2 farklı CTA metni ("Hemen başla", "Kayıt ol"), 2 çeşit mikro-metin ("Hesabını bir dakikada aç").
- Kayıt: sol tarafta 6 maddelik özellik listesi, 3 sekme (Giriş/Kayıt/Şifremi unuttum), "Ücretsiz programını oluştur" + "Kredi kartı gerekmez", herkese görünen "Developer Girişi (… Şifresiz)" düğmesi.
- Kabuk: `supabase||ai` doğruysa her kullanıcıya "Supabase Bağlı / OpenAI API Bağlı" rozetleri.
- Bugün: "Bugün." sayfa başlığı + ikinci selamlama başlığı, 4 istatistik kutusu, ders paneli + akış paneli, son yanlışlar tablosu.

## Sonra
Aynı nedenle görüntü yok (YAPILAMADI). Davranış kanıtı aşağıdaki komutlar ve diff'tir.

## Test / Ölçüm
| Komut | Beklenen | Gerçek | Çıkış kodu | Sonuç |
|---|---|---|---|---|
| `node --experimental-strip-types <scratchpad>/t/streak.test.mjs` | seri hesabı: boş, 1 gün, ardışık, bugün yapılmadı, boşluk, ay sınırı, bozuk veri | `streak: 9/9 PASS` | 0 | PASS |
| `python3 check-css.py app/globals.css` | parantez dengesi 0, tanımsız değişken yalnız JS'ten gelenler | açık-kapalı farkı 0, ( ) farkı 0, TANIMSIZ: `--d --sp --sy --v` (JS/JSX satır içi) | 0 | PASS |
| `node ts-check.js <11 dosya>` | sözdizimi | 11/11 `OK` | 0 | PASS |
| `node names-check.js <11 dosya>` (TypeScript ile tanımsız ad + kullanılmayan import/değişken) | 0 sorun | `TEMİZ` | 0 | PASS |
| `python3 class-check.py` (JSX className → CSS) | yeni sınıfların hepsi tanımlı | yeni sınıf eksik yok; listelenen 19 ad sınıf değil (görünüm adı, id, Tailwind `sr-only`) ve önceden vardı | 0 | PASS |
| `python3 deadscan.py` (CSS sınıf → kaynak) | kaynakta olmayan sınıf yok | 13 kalan: `dot-1..3 subject-1..3 tl-*` (dinamik üretilir), `recharts-*` (kütüphane) | 0 | PASS |
| `python3 palette-check.py` | palet dışı kromatik yok | CSS'te yalnız kobalt/şampanya `rgba` parıltı jetonları; TSX'te yok (auth.tsx Google logosu hariç, önceden vardı) | 0 | PASS |
| `python3 contrast.py` | tüm çiftler ≥4.5 (odak kenarı ≥3) | 23 çift AA, 1 çift UI≥3 (koyu tema kobalt kenar/siyah 3.33) | 0 | PASS |
| uydurma iddia taraması (`git diff` eklenen satırlar) | boş | boş | 0 | PASS |
| `next build`, `typecheck`, `lint`, görsel kontrol | — | YAPILAMADI: bu ortamda çalıştırılamaz (npm/node_modules yok, tarayıcı yok) | — | YAPILAMADI |

Not: test-önce sırası izlenemedi; `lib/plan/streak.ts` yazıldıktan hemen sonra testi yazıldı (yazar dürüstlüğü için kayıt).

## Orkestratör doğrulaması
<!-- yazar bu bölümü boş bırakır -->

## Kapsam dışı / bilinen eksikler
- YAPILAMADI: `next build`, tam tip denetimi, ESLint, ekran görüntüsü / görsel regresyon, gerçek tarayıcıda mobil (≤767px) düzen kontrolü, ekran okuyucu denemesi. Mobil düzen yalnız CSS okunarak gözden geçirildi.
- YAPILAMADI: önce/sonra PNG (`before.png`/`after.png`).
- Seri yalnız plan dersi tamamlama günlerinden hesaplanır; yanlış tekrarı yapılan günler dahil değildir (veride tarih kaydı bu amaçla tutulmuyor).
- Günün ilerlemesi: ders + o gün görülen en yüksek "sırası gelen tekrar" sayısı (cihazda `localStorage`'da gün bazında tutulur). Başka cihazda aynı günün ikinci yarısında açılırsa toplam düşük görünebilir.
- Ayarlar, arşiv, rapor, denemeler, notlar ekranlarının JSX'i değişmedi; tutarlılık turu bu ekranlara yalnız ortak CSS ölçeğiyle (düğme/alan yüksekliği, başlık boyutları, boşluk, yarıçap, bildirim şeridi) yansır. Ayarlar'daki yönetici tablosundaki satır içi stiller bilerek elle düzenlenmedi.
- Eski `HomeView` (hiçbir yerden çağrılmayan ana sayfa görünümü) silindi; `DueList` aynı dosyada kaldı.
- Kayıt formunda "Developer Girişi" düğmesi artık yalnız yetkili geliştirici e-postalarından biri yazılınca görünür (işlev duruyor).

## Yeniden üretme
1. Bu turun commit'ini checkout et (SHA: REVIEW-<n>.md başlığı / PR head'i).
2. `python3 check-css.py app/globals.css`, `node ts-check.js app/study/*.tsx app/study/plan/*.tsx app/study-app.tsx lib/plan/streak.ts`, `node --experimental-strip-types streak.test.mjs` (betikler oturum scratchpad'inde; gerekirse yeniden yazılır).
3. Ortamı olan makinede: `npm run build`, açılış / kayıt / Bugün / sihirbaz ekranlarını 1440px ve 375px'te gözle.

## Orkestratör doğrulaması (tur 1)
- `check-css.py`: süslü parantez ve ( ) farkı 0; tanımsız yalnız `--d --sp --sy --v` (JS/satır içi stilden gelir). Beklenen = gerçek.
- `ts-check.js` 11 dosya: 0 hata. `names-check.js`: TEMİZ (tanımsız ad / kullanılmayan import yok).
- `streak.test.mjs`: 9/9 PASS.
- Eklenen satırlarda uydurma iddia taraması (ücretsiz, fiyat, indirim, kullanıcı sayısı, kredi kartı): eşleşme yok.
- `HomeView` başka yerde kullanılmıyor (grep boş).
- Görsel kontrol, `next build`, tip denetimi: YAPILAMADI (ortam kısıtı).

## Tur 2 (inceleme turu 1 bulgularının düzeltmesi)

Düzeltilenler:
- ENGELLEYİCİ: v10 taban `.auth-page{grid-template-columns:minmax(0,1fr) minmax(360px,440px);max-width:1120px}` eski ≤900px kurallarını eziyordu. v10'un 900px medya bloğuna `.auth-page{grid-template-columns:1fr;max-width:520px}` eklendi (v10 bloğu dosyada sonra geldiği için basamaklamada kazanır).
- Aynı hata sınıfı: betik taramasında bulunan adaylar v10 medya bloklarına karşılık eklenerek kapatıldı: `.primary/.secondary` ≤650px yazı boyutu (.875rem), `.section-heading h2/.panel h2` ≤650px (1.125rem), `.section-heading` alt boşluk, `.stats` boşluk (≤1100 ve ≤767), `.stats` alt boşluk, `.dashboard-grid` boşluk, `.page-heading` boşluk, `.focus-card h2` (≤767). Değerler v10 ölçeğindeki en yakın adımdır (eski 10/12/14px yerine 12/16px), birebir eski piksel değil.
- Gerekçelendirilen (düzeltilmedi): `.primary/.secondary` `min-height` (eski ≤767px 46px, v10 tek ölçek 44px; bilinçli), `.page-heading p:last-child` `margin-top` (eski mobil 6px, v10 8px; fark 2px).
- Küçük 2: kompakt alanlar 44px kuralını eziyordu; v10 kuralı `:where()` ile özgüllüğü düşürüldü. Eski taban `.choice`/`input` (43px) ve `.choice-native` (42px) kuralları `var(--h-btn)` yapıldı; yoksa daha yüksek özgüllüklü eski kurallar `:where()` kuralını geçerdi. `.goal-add input{min-height:38px}` vb. artık kazanır.
- Küçük 3: `today.tsx` seri hesabı `localToday()` yerine sunucuyla aynı İstanbul tarihini veren `today()` (lib/study.ts, `Europe/Istanbul`) kullanıyor. `due-max:<e-posta>:<tarih>` anahtarları tek `due-max:<e-posta>` anahtarında `{date,max}` oldu; gün değişince sıfırlanır; okuma/yazma try/catch içinde (bozuk JSON 0 sayılır).
- Küçük 4: gün tamamlanma kutlaması günde bir kez oynar (`day-celebrated:<e-posta>` = tarih). Animasyonlar `.td-focus.is-done.celebrate` altına alındı; sonraki gösterimlerde tamamlanmış durum animasyonsuz (parıltı sabit, onay işareti çizili) görünür.
- Küçük 5: sihirbazda "Adım n / 4" çubuğu kaldı (adım adı orada); `wizard-steps` listesi, JSX'i, CSS'i ve artık kullanılmayan simge importları silindi. Not: adımlara tıklayıp atlama de kalktı; gezinme Geri/İleri düğmeleriyle.
- Küçük 6: `examDays===0` için "Sınav günü. Başarılar." dalı `study-app.tsx` ve `today.tsx`'e eklendi; negatif/NaN "Sınav tarihini güncelle" kalır.

Basamaklama taraması (mobil kontrolün tarayıcıda YAPILAMADIĞI, yerine bu tarama yapıldı): `cascade-audit.py` (scratchpad) v10 taban kurallarını v1-v9'daki `max-width` medya kurallarıyla seçici+özellik ailesi bazında karşılaştırır; v10'un kendi medya bloklarında (aynı ya da daha geniş eşik) karşılığı yoksa aday yazar. Kısıt: yalnız birebir aynı seçici metni eşleşir (farklı yazılmış ama aynı öğeyi hedefleyen seçiciler yakalanmaz).
- Düzeltme öncesi çıktı: 15 aday (`.primary/.secondary` font-size ve min-height, `.page-heading` gap ve p:last-child margin-top, `.section-heading` margin-bottom ve h2 font-size, `.stats` gap x2 ve margin-bottom, `.dashboard-grid` gap, `.focus-card h2` font-size, `.auth-page` grid-template-columns ve max-width). toplam 15
- Düzeltme sonrası çıktı: 3 aday (`.primary` min-height, `.secondary` min-height, `.page-heading p:last-child` margin-top); üçü yukarıda gerekçelendirildi. toplam 3

Tur 2 komutları (gerçek çıktı):
| Komut | Çıktı | Çıkış |
|---|---|---|
| `python3 check-css.py app/globals.css` | açık-kapalı farkı 0; ( ) farkı 0; TANIMSIZ `--d --sp --sy --v` | 0 |
| `node ts-check.js app/study/*.tsx app/study/plan/*.tsx app/study-app.tsx lib/plan/streak.ts` | 21 dosya `OK` | 0 |
| `node names-check.js` (aynı dosyalar) | TEMİZ | 0 |
| `python3 class-check.py` | TANIMSIZ SINIF SAYISI: 0 | 0 |
| `node --experimental-strip-types t/streak.test.mjs` | streak: 9/9 PASS | 0 |
| `python3 cascade-audit.py app/globals.css` | 3 aday (gerekçeli) | 0 |

Tur 2 sınırı: gerçek tarayıcıda mobil (≤900/767/650px) kontrol YAPILAMADI; `next build`, tip denetimi ve görsel kontrol de yapılamadı. Mobil düzeltmeler basamaklama taramasıyla ve CSS okunarak doğrulandı. Kutlamanın günde bir kez oynaması ve `today()` tarihi çalıştırılarak denenmedi (yalnız sözdizimi/ad denetimi).

