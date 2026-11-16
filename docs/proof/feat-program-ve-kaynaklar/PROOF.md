# KANIT — feat-program-ve-kaynaklar

| Görev | Tür | Aralık | Tur | Yazar modeli |
|---|---|---|---|---|
| PR 5: Bugün, Program, sihirbaz, Kaynaklar | görsel / karma | 5db9145..bu turun commit'i | 2 | sonnet |

## İddia
- [x] Bugün: başlık eylemi yalnız "Programı düzenle" (ikincil/hayalet; "Yanlış ekle" üst çubukta). Odak kartında tek birincil "Tamamla". Geniş ekranda (>=1280px) "Bugünün akışı" 2fr, yanında 1fr sütunda "Bugünkü tekrarların" + "Günün cümlesi"; dar ekranda alt alta. `.td-focus.is-done::before` kum gradyanı değişmedi.
- [x] Program: seçili hafta çipi kobalt dolgu değil koyu dolgu; gün kartlarında "Tamamla" ikincil (çerçeveli, onay ikonlu), tam satır; plan varken ekranda 0 kobalt dolgu (önce 8).
- [x] Program 768px altında gün sekmeli tek sütun (7 sekme, seçili günün kartı), yatay kaydırma yok (390/768/1024/1440'ta sw == cw).
- [x] Sihirbaz: kapat + başlık üstte, "Adım n / 3" göstergesi, sabit alt çubuk (solda hayalet "Geri", sağda birincil "Devam" / son adımda "Programı oluştur" ya da "Programı kaydet"); masaüstü 720px, mobil tam ekran, birincil kalan genişliği doldurur; seçili gün düğmeleri kobalt dolgu değil (önce 7 kobalt, sonra 1).
- [x] Kaynaklar: özet şeridi üç kutu (tek kalan kutu tam satır kuralı korundu); kartta ilerleme çubuğu ve "12/40 video" aynı satırda (çubuk kobalt, veri `done/total`); ⋯ menüsünde Düzenle + Sil (sil kırmızı, onaylı); sayfada tek kobalt birincil (ilk bitmemiş kaynak), diğer kartların eylemleri ikincil; oynatma listesinde "Devam et" bağlantısı.
- [x] Davranış korunur: planlama mantığı (lib/plan/resources.ts), ilerleme işaretleme, alarm, kaynak ekleme/düzenleme/silme, kuyruk/limit kodu değişmedi. Yerleşim dışındaki farklar kopya/sıra değişiklikleridir: kaynak kartında "YouTube'da devam et" yerine "Devam et" (erişilebilir ad: "Devam et: N. video, YouTube'da açılır"), gün kartında "Videoyu izle" yerine "Video" (kompakt kip), sihirbazda "Devam et" yerine "Devam"; kaynak kartında eylem sırası (bağlantı "Devam et" önce, sonra Geri al / bitirdim) ve lead belirleme (`lib/plan/resource-view.ts`, yeni saf yardımcı).
- [x] Dokunma hedefleri: ölçülen bütün ekranlarda (1440/390) kontrollerin yüksekliği >=44px; palet jetonlardan (yeni CSS'te düz hex yok).

## Önce
Taban dal (5db9145) bileşenleri + CSS'i, geçici `--detach` worktree'den (iş bitince kaldırıldı), aynı önizleme betiğiyle: `*-onceki.png`, `olcum-onceki.json`.
Bugün: ![](bugun-1440-acik-onceki.png) ![](bugun-390-acik-onceki.png) — Program: ![](program-1440-acik-onceki.png) ![](program-390-acik-onceki.png) — Sihirbaz: ![](sihirbaz-1440-acik-onceki.png) ![](sihirbaz-390-acik-onceki.png) — Kaynaklar: ![](kaynaklar-1440-acik-onceki.png) ![](kaynaklar-390-acik-onceki.png)
Koyu: aynı adlar `-koyu-onceki.png`; ayrıca `bugun-bitti-*`, `bugun-bos-*`, `program-bos-*`, `program-768/1024-acik`, `kaynaklar-768-acik`, `kaynaklar-bos-*`.

## Sonra
Bugün: ![](bugun-1440-acik-sonraki.png) ![](bugun-390-acik-sonraki.png) ![](bugun-bitti-1440-acik-sonraki.png) ![](bugun-bitti-1440-koyu-sonraki.png)
Program: ![](program-1440-acik-sonraki.png) ![](program-768-acik-sonraki.png) ![](program-390-acik-sonraki.png) ![](program-390-koyu-sonraki.png)
Sihirbaz: ![](sihirbaz-1440-acik-sonraki.png) ![](sihirbaz-390-acik-sonraki.png) ![](sihirbaz-390-koyu-sonraki.png)
Kaynaklar: ![](kaynaklar-1440-acik-sonraki.png) ![](kaynaklar-390-acik-sonraki.png) ![](kaynaklar-1440-koyu-sonraki.png) ![](kaynaklar-bos-390-acik-sonraki.png)
Koyu: her ad için `-koyu-sonraki.png`. Ölçümler: `olcum-sonraki.json`.
Komut: `ND_ROOT=$PWD SRC_ROOT=$PWD MODE=sonraki OUT=$PWD/docs/proof/feat-program-ve-kaynaklar PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node scripts/program-preview.mjs` (önce: `ND_ROOT=<taban worktree> MODE=onceki`).

## "Güncel CSS ile gerçek sorun var mıydı?" (önizleme ölçümü)
| Madde | Sonuç |
|---|---|
| 1 Bugün başlık eylemi | SORUN YOKTU: `pageActions` zaten yalnız `edit-plan` ("Programı düzenle", `secondary ghost`) döndürüyor; ölçüm `pageActions: ["Programı düzenle"]` (önce ve sonra). |
| 1 Bugün odak kartı | SORUN YOKTU: `.td-focus` tek birincil "Tamamla" içeriyordu; gün tamamken kum gradyan (`::before`, `--glow-b`) vardı, mor yok (bugun-bitti-*). Değişmedi. |
| 1 Bugün iki sütun | VARDI: "Bugünün akışı" tam genişlikte ayrı satırdı, "Bugünkü tekrarların" ile cümle kartı 1.7:1 ızgaradaydı (`dashCols 629/370`). Sonra: 1440'ta `td-columns` 667/333 (2:1), 390'ta tek sütun (358). Plan yokken eski `dashboard-grid` kalır. |
| 2 Program ızgarası genişliği | KISMEN VARDI: ızgara zaten 1024'lük içeriği 4 sütunla doldurur (245px x 4, önce/sonra aynı); 1120'lik kap 48px dolgu ile 1024 içerik verir, başlık/panel hizası bozulmasın diye ızgara dolguya taşırılmadı (bkz. Sapmalar). Gerçek sorun: 768/1024'te sayfa yatay taşıyordu (önizlemede sw 1010/1253) ve `.week-chips` `min-width:0` içermiyordu; önizlemenin açık Dialog karşılıkları da taşma ölçümünü bozuyordu (betik artık sayfa ekranlarında pencere içeriğini kaldırır). Sonra 390/768/1024/1440'ta sw == cw. |
| 2 Program <768px | VARDI (kısmen): tek sütun (`day-grid` 1fr) vardı ama 7 kart alt alta uzuyordu, gün sekmesi yoktu. Sonra: 7 sekme + yalnız seçili kart. |
| 2 Program kobalt | VARDI: 1440'ta 8 kobalt dolgu (seçili hafta çipi + 7 "Tamamla"; ilk ekranda 5). Sonra 0 (tablo aşağıda). |
| 2 Dokunma hedefi | VARDI: hafta çipleri/önceki-sonraki, gün kartı düğmeleri 34px; ayrıca `40-v5-v9.css` `transform:scale(.96)` bildirimi `.week-chips button,.day-pills button` için `:active` dışında da geçerliydi (44px çip ölçülen 42px). Sonra hepsi >=44. |
| 3 Sihirbaz | KISMEN VARDI: adım göstergesi (`wz-progress`) ve mobil sabit alt çubuk zaten vardı. Eksik/yanlış: pencere 940px, kapat sağ üstte standart X, adım göstergesi gövdenin içinde kayıyordu (üstte sabit değil), Geri `secondary` idi, "Devam et" etiketi, mobilde `.wizard{width:96vw}` (30-v3-v4.css) `.question-dialog` tam ekran kuralını ezip tam ekran olmuyordu, seçili gün düğmeleri 7 kobalt dolguydu. Sonra: 720px, DialogBar, sabit üst + sabit alt çubuk, 390'ta 390x844 tam ekran. Adım sayısı 3 (görevdeki "2/4" örnekti). |
| 4 Özet şeridi | SORUN YOKTU: `.res-stats` üç kutu, `<900px` tek kalan kutu tam satır, `>=900px` üç sütun (kaynaklar-390 / -1440). Değişmedi. |
| 4 Kaynak kartı eylemleri | VARDI: her kartta kobalt "Bugünkünü bitirdim" (3 kobalt), Düzenle/Sil kart altında metin/ikon düğmesi, ilerleme sayısı ve çubuk ayrı satırlardaydı. Sonra: kobalt yalnız ilk bitmemiş kaynakta, ⋯ menüsü başlıkta, sayı + çubuk + yüzde aynı satırda. |

## Ölçülen kobalt dolgu (görünür `button`/`a` arka planı rgb(52,84,209); mobilde ortak "+" / "Yanlış ekle" FAB (PR 3 kararı) sayılmaz)
| Ekran (açık tema) | Önce | Sonra | Sonra: hangisi |
|---|---|---|---|
| bugun 1440 / 390 | 1 / 1 | 1 / 1 | Tamamla |
| bugun-bitti 1440 / 390 | 1 / 1 | 1 / 1 | İlk kaynağını ekle (boş kaynak durumu; günün işi tamam) |
| bugun-bos 1440 / 390 | 1 / 1 | 1 / 1 | Programı oluştur |
| program 1440 / 768 / 1024 / 390 | 8 / 8 / 8 / 8 | 0 / 0 / 0 / 0 | (ekranın birincil eylemi yok; seçili hafta koyu) |
| program-bos 1440 / 390 | 1 / 1 | 1 / 1 | Programı oluştur |
| sihirbaz 1440 / 390 | 7 / 7 | 1 / 1 | Devam |
| kaynaklar 1440 / 768 / 390 | 3 / 3 / 3 | 1 / 1 / 1 | Bugünkünü bitirdim (345 TYT Matematik, ilk aktif) |
| kaynaklar-bos 1440 / 390 | 1 / 1 | 1 / 1 | Soru bankası ekle |
Küçük hedef (<44px) sayısı, sonra: bütün ekranlarda 0 (`olcum-sonraki.json` `kucukHedef` boş). Önce: bugun 6, program 40, sihirbaz 18, kaynaklar 22 (1440).

## Test / Ölçüm
| Komut | Beklenen | Gerçek | Çıkış kodu | Sonuç |
|---|---|---|---|---|
| `ND_ZOD_PATH=/opt/npm-tools/node_modules/zod/index.js npm test` | tümü yeşil | tests 83, pass 83, fail 0, skipped 0 | 0 | PASS |
| `scripts/program-preview.mjs` (1440/390 açık+koyu; program 768/1024) | sw==cw, küçük hedef yok | tüm ekranlarda sw==cw, `kucukHedef` boş | 0 | PASS |
Yeni testler: `tests/week-view.test.mjs` (5; modül yokken kırmızı koşuldu: ERR_MODULE_NOT_FOUND), `tests/program-render.test.mjs` (9 SSR; bileşen/CSS sonrası yazıldı, ama taban dalda çalıştırıldığında 6'sı kırmızı: pass 3 / fail 6), `tests/css-split.test.mjs` (+1, son parça artık 95). Kırmızı-önce yalnız saf mantıkta; SSR/CSS testleri işaretleme sonrası eklendi.

## Taslak kontrol (React efekt bağımlılıkları)
- Program gün sekmesi: seçim `{week,idx}` olarak tutulur, görünür sıra `dayIndexFor` ile render sırasında türetilir; hafta değişince sıfırlayan efekt yok (hafta = kimlik). Test: `week-view.test.mjs`.
- Sihirbaz: mevcut `useEffect(...,[open])` yalnız pencere açılınca sıfırlar (adım/cfg); dokunulmadı, başka bağımlılık eklenmedi.
- Program `open` günü `[plan]` efektiyle tazelenir (mevcut, dokunulmadı); Kaynaklar'da ⋯ menüsü Silme onayını kart düzeyindeki `del` durumuyla açar (menü içinde AlertDialog yok).

## Tur 2 (inceleme SKOR 4 bulguları)
- ÖNEMLİ, "Günü kaydır" kırpılması: gün kartı eylemleri `flex-wrap` oldu; "Tamamla" tam satır, "Günü kaydır" + "Video" her biri `flex:1 1 124px`, `nowrap` kaldırıldı; kart ikisine yetmiyorsa alt alta düşer. Kopya değişmedi. (Bu turdaki "kart yüksekliği satırlara dağıtılıyordu" kök neden anlatımı yanlıştı; gerçek neden Tur 3'te.) `.day-card .lesson-actions.compact` seçicisi iki yerden tek kurala birleştirildi.
- Ölçüm (`olcum-sonraki.json` `dugmeKirpma`; scrollWidth>clientWidth ya da ikon/etiket düğme dışına taşma = kırpık; 21 düğme/genişlik, 390'da 3):

| Genişlik | En dar düğme (px) | Kırpık | Tamamla–alt satır boşluğu | sw==cw |
|---|---|---|---|---|
| 768 | 212 | 0 | 8 | evet |
| 900 | 126 | 0 | 8 | evet |
| 1024 | 199 (tek sütun) | 0 | 8 | evet |
| 1280 | 130 | 0 | 8 | evet |
| 1440 | 214 (tek sütun) | 0 | 8 | evet |
| 390 (ek) | 159 | 0 | 8 | evet |
- Yeniden üretilen ve gözle bakılan: `program-1024-acik-sonraki.png`, `program-1440-acik-sonraki.png` (üç düğme alt alta, kırpma yok); diğer tüm `*-sonraki.png` dosyaları yeniden üretildi, ayrıca `program-900-*`, `program-1280-*` eklendi.
- Lead kaynak: `leadResourceId(list, today, todayOff)` artık `Resource[]` alır (`as Resource` yok; oynatma listesi bitişi `watched` ile). Sıra: bugün işi bekleyen (`unitsFor` var ve `done` değil) ilk kaynak (kitaplar önce); yoksa ilk bitmemiş; hepsi bitmiş/boş liste null. "Bugünkü pay tamamlandı" ölçütü `resources.ts` `unitsFor(...).done`. Testler: `tests/week-view.test.mjs` (4 test; kod önce yazıldı, kırmızı-önce koşulmadı).
- Bilinçli seçim: lead oynatma listesinde birincil kobalt eylem "Devam et" dış bağlantısıdır; ilerleme işaretleme ("Bugünkünü bitirdim") ikincile düşer.
- Dokunma hedefi: `95-program-kaynaklar.css` (0,3,0) kuralı mobilde genel 48px'i 44'e indiriyordu; <768px'te `.primary,.secondary` 48px'e geri alındı (gün kartı düğmeleri dahil; ölçüm: 390'da 48). Masaüstü 44px.
- Kaynak penceresi (`.res-dialog`, `resource-dialog.tsx`) gün seçici seçili günü sihirbazdaki gibi açık zemin + kobalt çerçeve yapar (`:is(.wizard,.res-dialog)`); önizleme bu pencereyi çizmediği için yalnız CSS ve kod incelemesiyle; Vercel önizlemesinde teyit gerekir.
- `sihirbaz-390-*.png`: önizleme düz `Dialog` karşılığı `sr-only` açıklamayı ("Okul ve sabit saatlerinle...") görünür çiziyor; gerçek uygulamada `sr-only` ile gizlidir (önizleme artefaktı).
- Test: `ND_ZOD_PATH=/opt/npm-tools/node_modules/zod/index.js npm test` -> tests 85, pass 85, fail 0, çıkış 0. Önizleme betiği genişletildi (`dugmeKirpma` ölçümü, program 900/1280).

## Tur 3 (inceleme 2. tur bulguları)
- ÖNEMLİ, kök neden: `00-tokens.css:7` genel `.compact{min-height:140px;padding:18px}` kuralı `.lesson-actions.compact`'a sızıyordu; `95-program-kaynaklar.css` yalnız `padding:0` yapıyor, `min-height:140px` kalıyordu (flex-wrap + `align-content` satırlara dağıtılan yükseklik bunun yan etkisiydi). Düzeltme: kurala `min-height:0` eklendi, gereksizleşen `align-content:flex-start` kaldırıldı. `.compact` için başka sızan özellik yok (`30-v3-v4.css`/`50-v10-v11.css` kuralları margin/gap/düğme boyutu; hepsi 95'te geçersiz kılınıyor). Başka ekran etkilenmedi (seçici `.day-card` altında).
- Ölçüm (`olcum-sonraki.json` `dugmeKirpma.kartAltBosluk` = kart alt kenarı − son düğme alt kenarı; kart padding + çerçeve = 16px, ölü boşluk yok): 390, 768, 900, 1024, 1280, 1440'ta 16px; satır aralığı 8px; düğme kırpılması 0 (21 düğme/genişlik, 390'da 3); sw==cw. Önizleme betiğine bu ölçüm eklendi.
- Gözle bakılan: `program-390-acik-sonraki.png`, `program-900-acik-sonraki.png` (gün kartı düğmelerin altında ölü boşluk yok). Tüm `*-sonraki.png` yeniden üretildi.
- Bilinçli seçim: lead kaynak bugünkü payı tamamlanmış kitaba düşerse (bekleyen iş yok) kart yalnız ikincil "Geri al" çizer, birincil kobalt eylem yok (`resources.tsx`). Test adı ve `resource-view.ts` yorumu bu davranışı anlatacak şekilde düzeltildi ("kobalt kaybolmaz" yanıltıcıydı).

## Orkestratör doğrulaması

- (Tur 1) `ND_ZOD_PATH=/opt/npm-tools/node_modules/zod/index.js npm test` yeniden koşuldu: 83/83, çıkış 0.
- (Tur 1) Gerçek Radix (⋯ menüsü, silme onayı, sihirbaz) bu ortamda denenemedi; Vercel önizlemesinde teyit gerekir.

## Kapsam dışı / bilinen eksikler
- Önizleme: Next/Tailwind yok; Radix bileşenleri düz karşılık; yazı tipi Manrope değil; açık/kapalı pencere ve DropdownMenu/AlertDialog gerçek tarayıcıda denenmedi (⋯ menüsü, Sil onayı, sihirbaz adım 2-3 ekran görüntüsü yok: SSR yalnız adım 1'i çizer). Mobil alt çubuk tam sayfa ekran görüntüsünde ortada görünür (önizleme artefaktı).
- "Programa ekle" kaynak kartı eylemi koddaki işlevlerde yok (kaynaklar günlerine göre otomatik yerleşir); uydurulmadı.
- Mobil "+"/Yanlış ekle FAB (PR 3) kobalt kalır; 390px'te her ekranda ikinci kobalt olarak ölçülür.
- Program gün kartı `role=button` içinde iç düğmeler (mevcut a11y borcu) bu PR'da değişmedi.
- Gerçek Next derlemesi, tsc ve lint bu ortamda koşturulmadı.

## Yeniden üretme
1. Bu turun commit'ini checkout et (SHA: REVIEW-<n>.md başlığı / PR head'i).
2. `ND_ZOD_PATH=/opt/npm-tools/node_modules/zod/index.js npm test`
3. `ND_ROOT=$PWD SRC_ROOT=$PWD MODE=sonraki OUT=$PWD/docs/proof/feat-program-ve-kaynaklar PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node scripts/program-preview.mjs`

## Orkestratör doğrulaması (Tur 2)

- `ND_ZOD_PATH=/opt/npm-tools/node_modules/zod/index.js npm test` yeniden koşuldu: 85/85, çıkış 0 (Tur 1: 83/83).
- Kaynak penceresindeki seçili gün biçimi önizlemede görünmüyor (res-dialog çizilmiyor); Vercel önizlemesinde teyit gerekir.

## Orkestratör doğrulaması (Tur 3)

- `ND_ZOD_PATH=/opt/npm-tools/node_modules/zod/index.js npm test` yeniden koşuldu: 85/85, çıkış 0.
- Diff kapsamı: 95-program-kaynaklar.css, program-preview.mjs, week-view test adı, resource-view yorumu, PROOF ve kanıt görselleri.
