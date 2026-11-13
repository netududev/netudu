# KANIT — soru-bankasi-oynatma-listesi

| Görev | Tür | Aralık | Tur | Yazar modeli |
|---|---|---|---|---|
| Soru bankası / kitap ve YouTube oynatma listesi kaynakları; programa entegrasyon | karma | origin/main + açılış kapısı commit'i..bu turun commit'i | 1 | sonnet |

## İddia
- [ ] Kaynak (soru bankası: test/sayfa; oynatma listesi) saf mantığı doğru: URL ayrıştırma, bugünkü aralık, gelecek gün tahmini, bitiş tarihi, ilerleme sınırları 0..total, watched → kaldığın yer (resources.test.mjs, 43 test).
- [ ] buildDay kaynak bloklarını okul/sabit/ders bloklarından SONRA, çakışmadan yerleştirir; kaynaksız günde çıktı ve ders blokları değişmez; geçmiş gün ve dinlenme gününde kaynak yok.
- [ ] Veritabanı şeması değişmedi; kaynaklar `config.resources` içinde; eski kayıt (resources yok, `sport` alanlı) okunur; tek bozuk kaynak programı açılmaz yapmaz; sihirbaz kaydı kaynakları ezmez (resource-schema.test.mjs, 10 test).
- [ ] API eylemleri zod ile doğrulanır; playlist URL yalnız youtube.com/youtu.be/m./music. alan adı + list kimliği `^[A-Za-z0-9_-]{10,64}$`; playlistItems sayfalama, 300 sınır, hata eşlemesi sahte fetch ile doğrulandı.
- [ ] Mevcut scheduler/pricing/streak/apple testleri yeşil (bozulma yok).
- [ ] UI: Kaynaklar sayfası (özet, iki bölüm, kartlar, video listesi, ekle/düzenle dialogu), Bugün'de "Bugünkü kaynaklar" + boş durum; 390 px'te taşma yok, açık/koyu tema (aşağıdaki statik önizlemeler).

## Önce
Yeni özellik; "önce" davranışı yok (kaynak kavramı main'de bulunmuyor). Kaynaksız `buildDay` çıktısının değişmediği testle gösterilir (`kaynaksız: öğe ve ders bloğu değişmez`).

## Sonra
Görseller **statik önizlemedir**: gerçek `app/globals.css` + JSX'ten ELLE eşlenmiş HTML (`static-preview.mjs`; Next/React çalıştırılmadı, Tailwind preflight yerine eşdeğer temel sıfırlama eklendi, Manrope bu makinede yüklü değil, yedek yazı tipi görünür). Sayılar/etiketler (Test 13–15, tahmini bitiş, süre, zaman çizelgesi) gerçek `lib/plan` koduyla hesaplandı; kaynak adları, video başlıkları ve "Ada" ÖRNEK veridir.
- ![](resources-1440.png) ![](resources-390.png)
- ![](today-resources-390.png) (koyu tema) ![](today-empty-390.png) (boş durum)
- ![](add-dialog-390.png) ![](add-dialog-book-390.png) (doğrulama hatası görünür)
Görsel düzeltmeler bu turda yapıldı: ilerleme çubuğu dolgusu (`.rc-progress .bar b`), mobil görev satırı sıkışması, tek kalan özet hücresi, ekle dialogu genişliği yalnız ≥768 px.

## Test / Ölçüm
Yükleyici: `node --experimental-strip-types --import <scratchpad>/t/reg.mjs` (resource-schema için `reg2.mjs`: zod'u /opt/npm-tools'tan, `../server`'ı sahte modülden çözer; ikisi de bu dizinde).
| Komut | Beklenen | Gerçek | Çıkış kodu | Sonuç |
|---|---|---|---|---|
| resources.test.mjs | tüm testler geçer | `43 test geçti` | 0 | PASS |
| resource-schema.test.mjs | tüm testler geçer | `10 test geçti` | 0 | PASS |
| scheduler.test.mjs (+pricing) | yeşil | `scheduler+pricing: 26 test geçti` | 0 | PASS |
| streak.test.mjs | yeşil | `streak: 9/9 PASS` | 0 | PASS |
| apple.test.mjs | yeşil | `apple: 15 test geçti` | 0 | PASS |
| ts.transpileModule, 17 değişen .ts/.tsx | hata 0 | 17/17 OK | 0 | PASS |
| tsc (strict) lib/plan + route + UI dosyaları, modül/React türleri eksik olduğundan TS2307/7016/7026/2875/7006/7031/2786 elenerek | lib/plan ve route'ta hata yok | lib/plan ve api'de hata yok; UI'da yalnız ortam kaynaklı (React ad alanı, `key` prop, eksik tür) | — | KISMİ |
| check-css.py globals.css | süslü/parantez farkı 0 | 0 / 0; tanımsız değişkenler eskisiyle aynı (--d,--font-manrope,--sp,--sy,--v: satır içi/next-font) | 0 | PASS |
| class-check.py | yeni sınıflar tanımlı | yeni sınıfların hepsi tanımlı; kalanlar önceden var olan/dinamik (dot-, tl-, sample-, routine-dialog) ve `className={x==='test'?…}` yanlış pozitifleri | 0 | PASS |
| icon-audit.mjs | eksik/bilinmeyen glif yok, ink≤1 | EKSİK [] · bilinmeyen [] · ink>1 [] (Bell/BellRing kenar 0.62 eskiden var) | 0 | PASS |

## Orkestratör doğrulaması
- Test komutu tekrar çalıştırıldı: {komut} → {sonuç}
- `git diff --stat` kapsam kontrolü: {sonuç}
- Aralık/Yeniden üretme: {…}
- Görseller: {…}
- Süreç/port temizliği: {…}

## Kapsam dışı / bilinen eksikler
- YouTube Data API gerçek çağrısı burada test edilemez (anahtar/ağ yok); yalnız sahte fetch ile eşleme/sayfalama/hata testi var.
- `next build` / tam `tsc` çalıştırılamadı (npm/proxy 403); UI davranışı React'te çalıştırılmadı, görseller statik eşlemedir.
- Yeni simge eklenmedi: Kaynaklar için `List`, kitap için `BookOpen`, liste için `Play` (mevcut glifler).
- Kaynak değişiklikleri tüm config'i oku-değiştir-yaz yapar; aynı anda iki sekmeden hızlı işlem yarışabilir (mevcut plan akışıyla aynı desen).
- Silinmiş/özel videolar API'de yer tutar; numaralandırma YouTube'un listesiyle bire bir olmayabilir. 300'den uzun listelerde yalnız ilk 300 başlık saklanır, kalan videolar "n. video" görünür.
- buildDay'e 3. parametre `today` eklendi (varsayılan UTC günü); UI çağrıları cihaz yerel gününü geçer.
- Mobil alt çubuğa öğe eklenmedi: Kaynaklar yan menüde ("Diğer") ve Program sayfasındaki düğmede.

## Yeniden üretme
1. Bu turun commit'ini checkout et (SHA: REVIEW-<n>.md başlığı / PR head'i).
2. `ND_ROOT=$PWD node --experimental-strip-types --import docs/proof/soru-bankasi-oynatma-listesi/reg.mjs …/resources.test.mjs` (reg.mjs/hook.mjs: scratchpad/t; resource-schema için `reg2.mjs`).
3. Önizleme: `static-preview.mjs` başlığındaki komut (playwright gerekir).

## Orkestratör doğrulaması (tur 1)
- Testler bağımsız yeniden koşuldu: resources 43, resource-schema 10, scheduler+pricing 26, streak 9/9, apple 15 → hepsi geçti (çıkış 0).
- Görseller açılıp bakıldı: resources-1440.png, today-resources-390.png (koyu), add-dialog-390.png — metin taşması yok, kartlar hizalı. Not: 1440'ta video listesi kendi içinde kayan alan olduğu için alt kenarda kırpılıyor (bilerek).
- `next build`/gerçek tsc çalıştırılamadı (npm 403); YouTube API gerçek çağrısı burada test edilemedi.
