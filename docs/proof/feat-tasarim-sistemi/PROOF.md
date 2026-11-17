# KANIT — feat-tasarim-sistemi

| Görev | Tür | Aralık | Tur | Yazar modeli |
|---|---|---|---|---|
| PR 2 (Faz 1): globals.css'i sıralı parçalara böl, ölü kuralları temizle; görünüm birebir aynı | karma | 3183fde..bu turun commit'i | 1 | sonnet |

## İddia
- [x] `app/globals.css` yalnız 3 @import + 8 sıralı `./styles/NN-*.css` @import'undan oluşuyor; parçaların birleşimi (başlık yorumları hariç) orijinalin @import'suz hâliyle bayt bayt aynıydı (SHA-256 39a80afe…), ardından yalnız 2 ölü sınıf (.dropzone, .camera-button) silindi (güncel SHA-256 8ca411a5…).
- [x] Silinen kurallar app/ ve components/ içinde hiçbir yerde geçmiyor ve dinamik üretilmiyor; şüpheli/dinamik olanlara dokunulmadı.
- [x] check-css: REQUIRED (lp-sheet, tag-card, nv-flow) var, FORBIDDEN (--glow-a, ndDrift) yok; `--glow-b` ve `.td-focus.is-done::before` duruyor.
- [x] Landing ve TagReview önizlemesi eski tek-dosya ve yeni bölünmüş CSS ile 1440 ve 390 px'te piksel piksel aynı (fark sınırlayıcısı None, PNG SHA-256'ları eşit).
- [x] Buton kuralları (.primary/.secondary/.lp-btn) değişmedi.

## Önce
Orijinal `3183fde:app/globals.css`: 1030 satır, SHA-256 `7bdaa448877c5a138ae6031c5b8fe0961c828dd37229a743708f5e85f9530afb`; @import'ları çıkarılmış hâli `39a80afe3cabd91f1b65eccd63ee1ce85797ffbc8671d728931650983ed1be2e`.
Önizleme görüntüleri (eski CSS): `landing-1440-eski.png`, `landing-390-eski.png`, `tag-review-1440-eski.png`, `tag-review-390-eski.png`.

## Sonra
Bölme: `app/styles/` = 00-tokens (13 satır), 10-v2 (37), 20-mobil-ve-tema (102), 30-v3-v4 (86), 40-v5-v9 (176), 50-v10-v11 (357), 60-v12 (69), 70-v13 (195); her birinin ilk satırı tek satırlık açıklama yorumu. `@layer base` bloğu (60-v12) ve `@theme inline` (00-tokens) bölünmedi.
Yeni CSS görüntüleri: `*-yeni.png` (aynı dört ad).
Bayt eşitliği (testin ilk sürümü, ölü kural silinmeden önce, 29/29 yeşildi): birleşim SHA-256 = 39a80afe… (orijinalle aynı). Ölü kural silindikten sonra test sabiti 8ca411a5b59483f64e0ab5ab5bc75db1078965d2c55569f40c5fef67d6ddd429 olarak güncellendi (orijinal özet test dosyasında yorum olarak duruyor).

Silinen seçiciler (tam liste; yalnız bu 2 sınıf, hepsi kural düzeyinde):
- `.dropzone`, `.dropzone:hover`, `.dropzone strong`, `.dropzone>span` (00-tokens); `.dropzone{min-height:150px;padding:18px}` (mobil @media içinde), `.dropzone{…}`, `.dropzone:hover`, `.dropzone strong` (koyu tema, 20-mobil-ve-tema); `.dropzone{…}` ve `.dropzone:hover{…}` (40-v5-v9)
- `.camera-button{display:none…}`, `.camera-button{display:inline-flex}` (20-mobil-ve-tema); `.camera-button` ögesi, dokunma hedefi seçici listesinden (50-v10-v11)

Analiz (`node tests/css-unused.mjs`): 495 sınıf, 20 kullanılmayan aday. Silinen: dropzone, camera-button (repoda tsx/ts/mjs'de geçmiyor). Silinmeyen: `d1`, `s2`, `c1` (note-visual.tsx'te `'nv-layer d'+(depth%4)`, `'nv-col c'+(i%3)`, `'nv-step-n s'+(i%3)` ile dinamik üretiliyor); şüpheli önekli 15 sınıf: dot-1/2/3, subject-1/2/3, upload-list, upload-state, recharts-text, tl-study/school/fixed/off/resource, sample-chart (kaynakta öneki geçiyor, şüphede silinmedi).

## Test / Ölçüm
| Komut | Beklenen | Gerçek | Çıkış kodu | Sonuç |
|---|---|---|---|---|
| (kırmızı) `node --experimental-strip-types --import ./tests/reg.mjs --test tests/css-split.test.mjs` (styles/ yokken) | 3 test başarısız | pass 1 / fail 3 (1, 2, 4 kırmızı) | 1 | PASS (beklenen kırmızı) |
| `ND_ZOD_PATH=/opt/npm-tools/node_modules/zod/index.js npm test` | tüm testler yeşil | tests 29 / pass 29 / fail 0 | 0 | PASS |
| `node tests/css-unused.mjs` (silme sonrası) | yalnız dinamik/şüpheli adaylar | güvenli liste: d1, s2, c1 (dinamik, tutuldu) | 0 | PASS |
| check-css analizi (parçaların birleşimi üzerinde `analyzeCss`) | ok:true; --glow-b ve `.td-focus.is-done::before` var | `{"ok":true,"missing":[],"forbiddenFound":[]}` true true | 0 | PASS |
| `CSS_MODE=old\|new … node docs/proof/feat-tasarim-sistemi/preview.mjs` + PIL ImageChops.difference().getbbox() | dört görüntüde None | landing-1440 (1440x4487) None; landing-390 (390x5567) None; tag-review-1440 (1440x1900) None; tag-review-390 (390x1900) None; eski/yeni PNG SHA-256 çiftleri eşit | 0 | PASS |

## Orkestratör doğrulaması

- `ND_ZOD_PATH=/opt/npm-tools/node_modules/zod/index.js npm test` yeniden koşuldu: 29/29, çıkış 0.
- Eski/yeni görüntü farkı (PIL getbbox) 4 görüntüde de None (piksel farkı 0).
- Yalnız app/globals.css ve app/styles/ değişti; bileşen dosyaları ve next.config.ts değişmedi.
- Gerçek `next build` bu ortamda yok; Vercel önizlemesinde teyit gerekir.

## Kapsam dışı / bilinen eksikler
- **Sapmalar (D):** `.primary`/`.secondary`/`.lp-btn` tanımlarına dokunulmadı; renk jetonlarına çevirme ve @media birleştirme bu PR'da yapılmadı, çünkü bunlar ekran görünümünü değiştirebilir ve ekran ekran görsel doğrulama gerektirir (sonraki PR'lar).
- Görsel eşitlik yalnız Landing ve TagReview önizlemesiyle kanıtlandı; statik önizleme gerçek Next/Tailwind derlemesi değildir (preflight yerine eşdeğer sıfırlama, yedek yazı tipi). Tailwind v4'ün `@import` açma davranışı (sıra korunumu) bu ortamda `next build` olmadığı için derleyiciyle sınanmadı; önizleme parçaları sıralı birleştirir.
- Silinen `.dropzone`/`.camera-button` için görsel kanıt yok (hiçbir bileşen kullanmıyor; önizlemede yer almıyor).
- Bölme testindeki beklenen özet, ölü kural temizliğinden sonra güncellendi (orijinal özet yorumda).

## Yeniden üretme
1. Bu turun commit'ini checkout et (SHA: REVIEW-<n>.md başlığı / PR head'i).
2. `ND_ZOD_PATH=/opt/npm-tools/node_modules/zod/index.js npm test`
3. `git show 3183fde:app/globals.css > /tmp/old-globals.css`; `ND_ROOT=$PWD OLD_CSS=/tmp/old-globals.css PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers NODE_PATH=/opt/npm-tools/node_modules` ile `CSS_MODE=old OUT=<dizin1>` ve `CSS_MODE=new OUT=<dizin2>` için `node docs/proof/feat-tasarim-sistemi/preview.mjs` çalıştır, PNG'leri karşılaştır.
4. `node tests/css-unused.mjs` (kalıcı değil, npm test'e dahil değil).
