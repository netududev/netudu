# KANIT — feat-css-kontrol

| Görev | Tür | Aralık | Tur | Yazar modeli |
|---|---|---|---|---|
| CSS kontrol + ekran görüntüsü araçları, tek komutla `npm test` (PR 1, ekran değişmez) | mantık | 91d893cf4086b184a29e08367883a7a54f082b7e..bu turun commit'i | 1 | sonnet |

## İddia
- [x] `scripts/check-css.mjs` eksik gerekli sınıf / yasaklı dize bulunca 1, temiz CSS'te 0 ile çıkar ve sorunu adıyla yazar.
- [x] `analyzeCss` ve `extractStylesheetHrefs` saf, dışa aktarılmış ve testlidir; CLI yalnız doğrudan çalıştırılınca devreye girer.
- [x] `scripts/screens.mjs` 1440x900 / 390x844 x açık / koyu için `<ad>-<genişlik>-<tema>.png` üretir.
- [x] `npm test` yeşil; docs/proof'taki mevcut lib testleri `tests/` altında mantık değişmeden (yalnız R yolu satırı) koşar.
- [x] Uygulama kodu (app/, components/, globals.css, next.config.ts) değişmedi; ekran görünümü aynı.

## Önce
Araçlar ve `tests/` yoktu; `package.json`'da `test` betiği yoktu. Kırmızı: `node --test tests/check-css.test.mjs` -> `scripts/check-css.mjs` modülü bulunamadı, `# fail 1` (screens.test.mjs için de aynı).

## Sonra
Canlı adres (`node scripts/check-css.mjs https://netudu-kohl.vercel.app`):
```
HATA: fetch failed
çıkış kodu 1
```
Ağ engelli: ajan ortamının proxy'si CONNECT tüneline 403 döndü (`curl: (56) CONNECT tunnel failed, response 403`; `NODE_USE_ENV_PROXY=1` ile de aynı). Canlı sonuç alınamadı; orkestratör kendi ağından koşmalı. Yerine node:http ile sahte HTML+CSS sunucusu (127.0.0.1:8765) kullanıldı:
```
$ node scripts/check-css.mjs http://127.0.0.1:8765/        # iyi CSS
1 stylesheet, 49 bayt
  http://127.0.0.1:8765/good.css
TAMAM: CSS güncel
çıkış kodu 0

$ node scripts/check-css.mjs http://127.0.0.1:8765/bad     # eksik sınıf + yasaklı dize
1 stylesheet, 60 bayt
  http://127.0.0.1:8765/bad.css
SORUN: gerekli sınıf yok: tag-card
SORUN: gerekli sınıf yok: nv-flow
SORUN: yasaklı dize var: --glow-a
SORUN: yasaklı dize var: ndDrift
BAŞARISIZ: CSS eski görünüyor
çıkış kodu 1
```
screens.mjs, aynı sahte sunucuya karşı (`NODE_PATH=/opt/npm-tools/node_modules PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node scripts/screens.mjs http://127.0.0.1:8765 <OUT> --paths "/,/bad"`), çıkış kodu 0, 8 dosya: `ana-1440-light.png`, `bad-1440-light.png`, `ana-1440-dark.png`, `bad-1440-dark.png`, `ana-390-light.png`, `bad-390-light.png`, `ana-390-dark.png`, `bad-390-dark.png` (PNG'ler commit'e konmadı; araç kanıtı dosya adları ve çıkış kodu). Görüntü içeriği (tema uygulaması) bu PR'da gözle doğrulanmadı.

## Test / Ölçüm
| Komut | Beklenen | Gerçek | Çıkış kodu | Sonuç |
|---|---|---|---|---|
| `npm test` | tüm dosyalar geçer | `# tests 17 / # pass 17 / # fail 0`; eski testler: 26, 16, 9, 3, 6, 11, 53 "test geçti" | 0 | PASS |
| `node --test tests/check-css.test.mjs` (kırmızı, kod yokken) | başarısız | `# fail 1` (modül yok) | 1 | PASS (kırmızı doğrulandı) |
| `node --test tests/check-css.test.mjs` (kodla) | 6 geçer | `# pass 6 / # fail 0` | 0 | PASS |
| `node --test tests/screens.test.mjs` (kodla) | 4 geçer | `# pass 4 / # fail 0` | 0 | PASS |
| `node scripts/check-css.mjs https://netudu-kohl.vercel.app` | 0 ya da 1 + sorun listesi | `HATA: fetch failed` (proxy 403) | 1 | AĞ ENGELLİ |

## Orkestratör doğrulaması

- Tur 2 sonrası `ND_ZOD_PATH=/opt/npm-tools/node_modules/zod/index.js npm test` worktree'de yeniden koşuldu: 25/25 geçti, çıkış 0.
- Mevcut dosyalardan yalnız package.json değişti; app/, components/, globals.css, next.config.ts değişmedi.
- Canlı adres bu ortamdan (proxy 403) denetlenemedi; birleştirmeden sonra kullanıcı `node scripts/check-css.mjs https://netudu-kohl.vercel.app` koşacak.

## Kapsam dışı / bilinen eksikler
- Ekran içi sekme tıklaması yok (PR 2).
- CI iş akışı (`.github/workflows`) eklenmedi; yetki yok. Kullanım yorumu `scripts/check-css.mjs` başında.
- Canlı adres bu ortamdan erişilemedi.
- `tests/hook.mjs` zod'u önce normal çözer, bulamazsa `ND_ZOD_PATH` (zod/index.js yolu) ya da `NODE_PATH` altından dener, yoksa açık hata verir (sabit yol kaldırıldı; bu ortamda `node_modules` yok, `npm test` `ND_ZOD_PATH=/opt/npm-tools/node_modules/zod/index.js` ile koşuldu); `ND_ROOT` kullanılmıyor, testler `import.meta.url` ile repo köküne bağlanır.
- docs/proof altındaki eski kopyalar silinmedi.

## Yeniden üretme
1. Bu turun commit'ini checkout et (SHA: REVIEW-<n>.md başlığı / PR head'i).
2. `npm test`
3. `node scripts/check-css.mjs <URL>`; `node scripts/screens.mjs <BASE_URL> <OUT_DIR> --paths "/,/study"` (global Playwright gerekir).
