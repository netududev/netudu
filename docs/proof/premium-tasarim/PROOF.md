# KANIT — premium-tasarim

| Görev | Tür | Aralık | Tur | Yazar modeli |
|---|---|---|---|---|
| Siteyi siyah/beyaz + kobalt (#3454D1) + şampanya (#D8C7A3) paletiyle sade, premium ve bol animasyonlu yap | görsel | 7f36f73..bu turun commit'i | 1 | sonnet |

## İddia
- [ ] Tema jetonları (açık/koyu/shadcn kökü) yalnız siyah/beyaz/nötr gri + kobalt + şampanya (+ düşük doygunluklu hata kırmızısı) içerir; eski yeşil/turkuaz/mavi/sarı/mercan/mint değerleri ve renkli pastel zeminler kalmadı (jeton adları geriye uyum için korundu, değerleri nötr/palet).
- [ ] globals.css sözdizimi bütün (süslü parantez dengeli) ve kullanılan her var(--x) tanımlı (yalnız JS'in yazdığı --d/--sy/--sp, fallback'li).
- [ ] Değişen TS/TSX dosyaları sözdizimi olarak geçerli.
- [ ] Metin kontrastları WCAG AA (şampanya beyaz zeminde metin olarak kullanılmıyor; açık temada koyu şampanya mürekkebi veya şampanya zemin + koyu metin).
- [ ] Hareket: kademeli fade+rise girişleri, kart hover yükselme/çizgi parlaması, düğme ışık süpürme/basılma, ilerleme çubuğu doldurma, hero'da düşük opaklıkta kayan kobalt-şampanya ışığı, kayan segment/sekme göstergesi; hepsi mevcut prefers-reduced-motion kuralı altında kapanır.
- [ ] İşlev, API ve fonksiyonel sınıf adları değişmedi (yalnız stil/jeton + küçük JSX dokunuşları).

## Önce
Taban: 7f36f73. Eski jetonlar: `--brand:#0B74C9` (açık), `--brand:#38B6FF` (koyu), `--primary:#086d64`, `--mint/--coral/--sun`, `--*-bg` pastel zeminler. Görsel "önce" ekran görüntüsü: YAPILAMADI (tarayıcı/derleme yok).

## Sonra
Doğrulama betikleri aşağıda (scratchpad: /tmp/claude-0/-home-claude/ceb4c31e-2408-5fe2-8036-41d47bb14baf/scratchpad). Görsel "sonra" ekran görüntüsü: YAPILAMADI.

## Test / Ölçüm
| Komut | Beklenen | Gerçek | Çıkış kodu | Sonuç |
|---|---|---|---|---|
| `python3 scratchpad/check-css.py app/globals.css` | parantez farkı 0, tanımsız var yok | süslü fark 0, ( ) fark 0, tanımlı 109/kullanılan 81, tanımsız yalnız `--d,--sp,--sy` (JS yazar, `var(--x,fallback)`; orijinalde de aynı) | 0 | PASS |
| `node scratchpad/ts-check.js app/layout.tsx app/study/{exams,auth,settings,landing}.tsx` (typescript transpileModule) | tanı yok | 5 dosya OK | 0 | PASS |
| kromatik hex taraması (globals.css) | yalnız palet | #3454D1 (+#2A45B3 hover, #4A68E0 koyu hover, #8DA2F2 koyu metin tonu), #D8C7A3 (+#F4EEDF, #5F4E26, #1C1810, #4A4128, #1A1507), hata #A8383C/#E58A8D | - | PASS |
| `grep -riE "#086d64\|#0B74C9\|#38B6FF\|#5fd0b6\|#56baa7\|#2fb597\|#1b1f23\|#e1e8ed" app public/manifest.webmanifest` | boş | yalnız `app/api/auth/forgot-password/route.ts` (e-posta HTML'i; API, kapsam dışı) | - | KISMEN (gerekçeli) |
| `python3 scratchpad/contrast.py` | tüm metin çiftleri >=4.5 | en düşük 4.83 (koyu: beyaz/kobalt hover); kobalt/beyaz 6.30; koyu temada kobalt metin tonu 8.58; yalnız kenar/odak halkası olan #3454D1/siyah 3.33 (UI >=3) | 0 | PASS |
| `next build` / `next lint` / görsel ekran görüntüsü | - | YAPILAMADI (npm/derleme ve tarayıcı yok) | - | YAPILAMADI |

## Orkestratör doğrulaması

## Kapsam dışı / bilinen eksikler
- Görsel sonuç hiç görülmedi; `next build` ve ekran görüntüsü YAPILAMADI.
- `app/api/auth/forgot-password/route.ts` e-posta şablonu eski renkleri (#5fd0b6, #2fb597) taşıyor; API dosyası olduğundan dokunulmadı.
- Üyelik rozeti için kodda "premium üyelik" kavramı yok; `.badge-premium` (şampanya) sınıfı hazır, kullanılmıyor. `.tag` rozetleri şampanyadır.
- Google giriş düğmesindeki dört renkli "G" logosu (auth.tsx SVG) marka gereği korundu.
- Kayan segment göstergesi `:has()` + nth-child ile (2–5 eşit genişlikli segment) yapıldı; `routine-tabs` (kaydırmalı) ve `archive` segmenti yalnız renk geçişi alır.

## Yeniden üretme
1. Bu turun commit'ini checkout et (SHA: REVIEW-<n>.md başlığı / PR head'i).
2. `python3 <scratchpad>/check-css.py app/globals.css` ve `node <scratchpad>/ts-check.js <dosyalar>` (betikler commit'te yok; PROOF'taki komutlardan yeniden yazılabilir) ve `npm run build` + açık/koyu tema ekran kontrolü.

## Orkestratör doğrulaması
- `check-css.py` yeniden çalıştırıldı: süslü parantez farkı 0, ( ) farkı 0, tanımsız değişken yalnız JS'in yazdığı `--d`, `--sp`, `--sy` (fallback'li, orijinalde de aynı). Beklenen = gerçek.
- `ts-check.js` 5/5 OK (layout, exams, auth, settings, landing).
- Eski renk taraması: yalnız `app/api/auth/forgot-password/route.ts` (e-posta HTML'i, kapsam dışı).
- `globals.css` hex dağılımı: palet (#3454D1, #D8C7A3, türevleri) + nötr griler + iki düşük doygunluk hata kırmızısı.
- Görsel ekran görüntüsü ve `next build`: YAPILAMADI (ortam kısıtı: npm 403, tarayıcıda yerel sunucu açılamıyor).
