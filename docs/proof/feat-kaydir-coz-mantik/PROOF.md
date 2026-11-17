# KANIT — feat-kaydir-coz-mantik

| Görev | Tür | Aralık | Tur | Yazar modeli |
|---|---|---|---|---|
| PR K1: Kaydır Çöz mantığı (lib/swipe/*), markLearned, fotoğraf Cache-Control, birim testleri; arayüz yok | mantık | feat/rapor-not-ayarlar..bu turun commit'i | 1 | sonnet |

## İddia
- [x] `lib/swipe/queue.ts`: havuz (matchesSubject, tanınmayan dışarıda, öğrenilen yalnız includeLearned, kapsam due=A / all=A+B), katman (A/B/C), sıra (A: eski vade, eşitlikte düşük aşama; B: yakın vade, eşitlikte topicHistory fazla olan; C: en eski son tekrar) ve deterministik karıştırma (baş katmanın ilk 5 sorusu, son iki konudan farklı ilk soru, yoksa ilk) testle kanıtlı.
- [x] Yeniden çıkma: Bilemedim 4 / 8 kart sonra, üçüncüde düşer ve `struggle` listesine girer; kuyruk kısaysa sona; Atlandı bir kez sona, ikincide düşer.
- [x] Yazma kuralı: A iki sonucu da, B/C yalnız Bilemedim; oturumdaki yalnız ilk (atlama olmayan) sonuç `pending`'e girer; "Sonucu değiştir" (`markCurrent`) istek üretmez, `leaveCard` tek kayıt bırakır.
- [x] `lib/swipe/session.ts`: serialize/restore gidiş-dönüş; bozuk JSON, eski gün, yanlış şekil → null; silinmiş soru kimlikleri her listeden ayıklanır; depolama hatası/yokluğu fırlatmaz; anahtar `kaydir:<kullanıcı>:<gün>`; eski gün anahtarları silinir; bekleyen yazma en fazla 3 deneme.
- [x] `lib/swipe/answer.ts`: "B", "b)", " B " → "B"; "12", "x=3", boş → null.
- [x] PATCH `markLearned`: aşama = `reviewIntervals.length` (6), `next_review` = null, `reviewed` = 1, `review_log`'a satır eklenmez; mevcut review/resetReview/reviewed akışlarına dokunulmadı (tek satır eklendi).
- [x] Fotoğraf yanıtı `Cache-Control: private, max-age=604800, immutable`; 404 yolları değişmedi.
- [x] Yeni npm paketi yok, arayüz (React/CSS) dosyası yok; `lib/study.ts` yardımcıları yeniden kullanıldı (kopya yok).

## Önce
Davranışsal "önce" yok (arayüz yok; yeni modüller). Test dosyaları önce yazıldı ve modüller yokken kırmızıydı: `node --experimental-strip-types --import ./tests/reg.mjs --test tests/swipe-*.test.mjs` → `# fail 4`. Route kaynak-bağlantı testleri route düzenlenene kadar kırmızıydı (PATCH şemasında `markLearned` yok, görsel yanıtta `no-store`).

## Sonra
`node --experimental-strip-types --import ./tests/reg.mjs --test tests/swipe-*.test.mjs` → `# tests 4 / # pass 4 / # fail 0` (dosya başına bir; içlerinde 35 `t(...)` durumu: queue 21, session 7, answer 2, server 5; hepsi `ok`).

## Test / Ölçüm
| Komut | Beklenen | Gerçek | Çıkış kodu | Sonuç |
|---|---|---|---|---|
| `node --experimental-strip-types --import ./tests/reg.mjs --test tests/swipe-*.test.mjs` (ND_ZOD_PATH ile) | 4 dosya yeşil | 4/4 geçti, 35 durum `ok` | 0 | PASS |
| `ND_ZOD_PATH=/opt/npm-tools/node_modules/zod/index.js npm test` | tümü yeşil | 103 test, 102 geçti, 1 kaldı: `Bugün: gün tamamsa .td-focus.is-done ve kum ışıma sınıfı` (tests/program-render.test.mjs:45) | 1 | FAIL (bu görevden bağımsız, aşağıya bak) |
| Aynı `npm test`, bu PR'dan ÖNCEKİ HEAD'in geçici `--detach` worktree'sinde | taban yeşil (99) | 99 test, 98 geçti, aynı test kaldı | 1 | Hata taban dalda zaten var |

## Kapsam dışı / bilinen eksikler
- **Taban dalda kırmızı test:** `program-render.test.mjs` "Bugün: gün tamamsa .td-focus.is-done…" bu PR'ın değişikliklerinden önce de kalıyor (aynı komut, temiz HEAD'de kanıtlandı). Nedeni araştırılmadı (görev kapsamı dışı; bu ortamın tarihi/ortamıyla ilgili olabilir). Görevdeki "99 yeşil" beklentisi bu ortamda tutmuyor; yeni testlerle 102/103.
- **Route gerçekten çalıştırılmadı.** PATCH ve fotoğraf GET oturum (`owner`) ve D1/R2 ister; mevcut testlerde route çağıran kalıp yok. Bu yüzden kural saf yardımcıya çıkarıldı (`lib/swipe/server.ts`: `learnedState()`, `IMAGE_CACHE_CONTROL`) ve o sınandı; route'un yardımcıyı kullandığı yalnız kaynak metni regex testiyle (`route bağlantısı`) sabitlendi. Gerçek HTTP yanıtı/başlığı ve SQL güncellemesi doğrulanmadı (Vercel/yerel çalıştırma gerekir).
- `tsc` çalıştırılmadı; tip hataları yakalanmadı (testler `--experimental-strip-types` ile tipleri siler).
- Radix/React yok bu PR'da; arayüz doğrulaması K2'de.
- SwipeSession şekli planın metninde okunabilir kısmı (`pending`) dışında kesildiği için yazarca türetildi: `day, subject, scope, includeLearned, queue, current, history, mark, results, struggle, pending`.
- Bilinçli karar: includeLearned açıksa katman C kapsamdan bağımsız eklenir; `next_review` boş soru en eski vade sayılır; karıştırma anahtarı `ders|konu`.

## Yeniden üretme
1. Bu turun commit'ini checkout et (SHA: REVIEW-<n>.md başlığı / PR head'i).
2. `ND_ZOD_PATH=/opt/npm-tools/node_modules/zod/index.js npm test`
3. Yalnız yeni testler: `ND_ZOD_PATH=/opt/npm-tools/node_modules/zod/index.js node --experimental-strip-types --import ./tests/reg.mjs --test tests/swipe-*.test.mjs`

## Orkestratör doğrulaması

## Orkestratör doğrulaması (Tur 1)

- `ND_ZOD_PATH=/opt/npm-tools/node_modules/zod/index.js npm test`: 103/103, çıkış 0.
- Taban dalda (PR 5) `tests/program-render.test.mjs` "gün tamamsa .td-focus.is-done" testi tarihe bağlıydı: fixture örnek soruların `next_review` değeri sabit 2026-11-17; 17 Kasım'dan itibaren bu sorular vadesi gelmiş sayıldığından `allDone` false oluyordu. Üretim kodunda hata yok; test `rows:[]` ve 7 günlük sabit Date ile tarihten bağımsız yapıldı (bu dalda ayrı commit). PR #13'teki aynı test 17 Kasım'dan sonra kırmızıdır.
- Gerçek HTTP/route çalışması, Radix ve `tsc` bu ortamda doğrulanamadı.
