# KANIT — foto-soru-gorsel-not

| Görev | Tür | Aralık | Tur | Yazar modeli |
|---|---|---|---|---|
| Yanlış ekle: yalnız fotoğraf + yapay zekâ sınıflandırma + etiket ekranı; görsel ders notu; giriş sayfasında mor parıltı yerine fotoğraf paneli | karma | 9c3c24f..bu turun commit'i | 1 | sonnet |

## İddia
- [ ] Sınıflandırma çıktısı güvenle doğrulanır: geçersiz ders mevcut derse düşer, konu MEB listesine eşlenir, güven eşiği 0,6, bozuk girdi hiçbir zaman fırlatmaz (classify.test.mjs, 17 test).
- [ ] POST /api/questions için deneme adı, tarih, sınav, ders zorunlu değil; varsayılanlar (bugün, "Yanlış defteri", profil sınıfı, ilk ders + "Konu belirlenmedi" + kontrol bayrağı) (question-defaults.test.mjs, 8 test).
- [ ] Not JSON şeması doğrulanır, eski markdown notlar eskisi gibi çizilir, bozuk önekli kayıt çökmez (note-format.test.mjs, 11 test).
- [ ] Veritabanı şeması değişmedi; alt konu/zorluk/güven `questions.analysis` JSON'unda `classification` anahtarında, görsel not `study_notes.content` içinde "ndnote1:" önekli JSON. memory-db üzerinde INSERT/UPDATE denendi.
- [ ] Giriş: mor/radyal parıltı ve ndDrift kaldırıldı; fotoğraf yokken "FOTOĞRAF" yer tutucusu yok, ürün kartlarından kompozisyon görünür (landing-1440.png, landing-390.png).
- [ ] Yanlış ekle ve etiket ekranı, görsel not 390 px'te taşmıyor (sw=cw ölçümü), koyu temada okunur.
- [ ] Eski testler yeşil.

## Önce
Mantık kanıtı: yeni özellik. Kırmızı adım: ilk koşuda lib/classify.ts, question-defaults.ts, note-format.ts yoktu ve testler modül bulunamadı hatasıyla düştü (not: ilk iki koşuda ND_ROOT tanımsızdı, yani kırmızı "modül yok"tan çok yükleyici hatasıydı; note-format için tam kırmızı gözlendi). Eski giriş/yükleme görselleri alınmadı.

## Sonra
Görseller **statik önizlemedir** (static-preview.mjs): gerçek app/globals.css + GERÇEK Landing, NoteBody, TagReview, UploadDialog bileşenlerinin react-dom/server çıktısı; radix Dialog/Select düz karşılıklarla (ui-stubs.tsx) yerine konuldu. Durum gerektiren iki parça ELLE yazıldı: seçilen fotoğraf ızgarası ve açık "Düzenle" kartı. Next/React tarayıcıda çalıştırılmadı; yazı tipi Manrope değil yedek. Kart içerikleri ve küçük resimler örnektir.
- ![](landing-1440.png) ![](landing-390.png) (fotoğrafsız kompozisyon)
- ![](upload-390.png) ![](tag-review-390.png) ![](tag-review-390-dark.png)
- ![](note-visual-390.png) ![](note-visual-1440.png) ![](note-visual-390-dark.png) ![](note-diagrams-390.png) (akış, karşılaştırma, döngü) ![](note-legacy-390.png) (eski not)

## Test / Ölçüm
Yükleyici: bu dizindeki reg.mjs/reg2.mjs (+hook, server-stub). Hepsi `ND_ROOT=$PWD` ile.
| Komut | Beklenen | Gerçek | Çıkış kodu | Sonuç |
|---|---|---|---|---|
| classify.test.mjs | yeşil | 17 test geçti | 0 | PASS |
| question-defaults.test.mjs | yeşil | 8 test geçti | 0 | PASS |
| note-format.test.mjs | yeşil | 11 test geçti | 0 | PASS |
| soru-bankasi resources / queue / resource-schema | yeşil | 53 / 3 / 11 test geçti | 0 | PASS |
| tools scheduler / streak / apple | yeşil | 26 / 9 / 15 | 0 | PASS |
| ts.transpileModule, 24 değişen .ts/.tsx | hata 0 | 24/24 OK | 0 | PASS |
| memory-db INSERT (19 sütun) + UPDATE + PATCH denemesi | satır doğru | classification JSON yazıldı/okundu | 0 | PASS |
| check-css.py | fark 0 | 0 / 0; tanımsız yalnız --cols (satır içi), --d, --font-manrope, --sp, --v (eskiden var) | 0 | PASS |
| class-check.py | yeni sınıflar tanımlı | kalanlar dinamik (c/d/s, nv-) ve sr-only (Tailwind) yanlış pozitifleri | 0 | PASS |
| icon-audit.mjs | eksik yok, ink≤1 | EKSİK [] · ink>1 [] · yeni Lightbulb kenar ≥1 (Bell/BellRing 0.62 eskiden var) | 0 | PASS |

## Orkestratör doğrulaması
(Orkestratör tarafından doldurulur.)

## Kapsam dışı / bilinen eksikler
- Gerçek OpenAI çağrısı ve `next build`/tam tsc çalıştırılmadı; sınıflandırma istemi ve not şeması gerçek modelle denenmedi.
- Fotoğraf dosyası yok: lib/hero.ts HERO_PHOTO=null. Dosya eklenince yol yazılır.
- Zorluk/alt konu/güven yalnız analysis.classification içinde; arşiv filtresi/rapor bunları kullanmıyor (yalnız kart ve "Kontrol et" rozeti).
- Eski Preview/NetChart kodu kaldırıldı; ilgili .lp-preview/.lp-card CSS kuralları globals.css'te ölü kaldı.
- Program ön ayarıyla açılan yükleme (plan/ui.tsx) artık soru metni almıyor; ders+konu ön ayarı varsa sınıflandırma atlanır.

## Yeniden üretme
1. Bu turun commit'ini checkout et (PR head'i).
2. `P=docs/proof/foto-soru-gorsel-not; ND_ROOT=$PWD node --experimental-strip-types --import ./$P/reg2.mjs $P/classify.test.mjs` (aynısı question-defaults, note-format).
3. Eski testler: soru-bankasi-oynatma-listesi PROOF'undaki komutlar.
4. Önizleme: `ND_ROOT=$PWD PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers NODE_PATH=/opt/npm-tools/node_modules node --experimental-strip-types --import ./$P/reg.mjs $P/static-preview.mjs`.

## Orkestratör doğrulaması (tur 1)
- Testler bağımsız yeniden koşuldu (ND_ROOT=$PWD): classify 17, note-format 11, question-defaults 8, resources 53, queue 3, scheduler+pricing 26, streak 9/9, apple 15 → hepsi geçti.
- Görsellere bakıldı: landing-1440 (mor parıltı yok, fotoğrafsız kompozisyon, yer tutucu yazısı yok), tag-review-390, note-visual-390 — taşma yok.
- Gerçek OpenAI çağrısı, React etkileşimi ve next build çalıştırılmadı.
