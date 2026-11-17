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
- [x] PATCH `markLearned`: aşama = `reviewIntervals.length` (6), `next_review` = null, `reviewed` = 1, `review_log`'a satır eklenmez; mevcut review/resetReview akışları aynen; `reviewed===true` ve `reviewed===false` dallarına `!d.markLearned` koruması eklendi (markLearned ile çelişen `reviewed` değeri öğrenildi durumunu bozmaz; regex testiyle sabit).
- [x] Fotoğraf yanıtı `Cache-Control: private, max-age=604800, immutable`; 404 yolları değişmedi.
- [x] Yeni npm paketi yok, arayüz (React/CSS) dosyası yok; `lib/study.ts` yardımcıları yeniden kullanıldı (kopya yok).

## Önce
Davranışsal "önce" yok (arayüz yok; yeni modüller). Test dosyaları önce yazıldı ve modüller yokken kırmızıydı: `node --experimental-strip-types --import ./tests/reg.mjs --test tests/swipe-*.test.mjs` → `# fail 4`. Route kaynak-bağlantı testleri route düzenlenene kadar kırmızıydı (PATCH şemasında `markLearned` yok, görsel yanıtta `no-store`).

## Sonra
`node --experimental-strip-types --import ./tests/reg.mjs --test tests/swipe-*.test.mjs` → `# tests 4 / # pass 4 / # fail 0` (dosya başına bir; içlerinde 42 `t(...)` durumu: queue 25, session 9, answer 3, server 5; hepsi `ok`).

## Test / Ölçüm
| Komut | Beklenen | Gerçek | Çıkış kodu | Sonuç |
|---|---|---|---|---|
| `node --experimental-strip-types --import ./tests/reg.mjs --test tests/swipe-*.test.mjs` (ND_ZOD_PATH ile) | 4 dosya yeşil | 4/4 geçti, 42 durum `ok` | 0 | PASS |
| `ND_ZOD_PATH=/opt/npm-tools/node_modules/zod/index.js npm test` | tümü yeşil | 103 test, 103 geçti (Tur 1 doğrulamasında taban dalın tarihe bağlı testi düzeltildi; bkz. Orkestratör doğrulaması) | 0 | PASS |
| Aynı `npm test`, bu PR'dan ÖNCEKİ HEAD'in geçici `--detach` worktree'sinde | taban yeşil (99) | 99 test, 98 geçti, aynı test kaldı | 1 | Hata taban dalda zaten var |

## Kapsam dışı / bilinen eksikler
- **Taban dalda kırmızı test (giderildi):** `program-render.test.mjs` "Bugün: gün tamamsa .td-focus.is-done…" tarihe bağlıydı (fixture `next_review` 2026-11-17; 17 Kasım'dan sonra kırmızı). fb3bc3d ile test tarihten bağımsız yapıldı; güncel `npm test` 103/103 yeşil. Yukarıdaki "99 test, 98 geçti" satırı düzeltmeden ÖNCEKİ tabanın ölçümüdür.
- **Route gerçekten çalıştırılmadı.** PATCH ve fotoğraf GET oturum (`owner`) ve D1/R2 ister; mevcut testlerde route çağıran kalıp yok. Bu yüzden kural saf yardımcıya çıkarıldı (`lib/swipe/server.ts`: `learnedState()`, `IMAGE_CACHE_CONTROL`) ve o sınandı; route'un yardımcıyı kullandığı yalnız kaynak metni regex testiyle (`route bağlantısı`) sabitlendi. Gerçek HTTP yanıtı/başlığı ve SQL güncellemesi doğrulanmadı (Vercel/yerel çalıştırma gerekir).
- `tsc` çalıştırılmadı; tip hataları yakalanmadı (testler `--experimental-strip-types` ile tipleri siler).
- Radix/React yok bu PR'da; arayüz doğrulaması K2'de.
- SwipeSession şekli planın metninde okunabilir kısmı (`pending`) dışında kesildiği için yazarca türetildi: `day, subject, scope, includeLearned, queue, current, history, mark, results, struggle, pending`.
- Bilinçli karar: includeLearned açıksa katman C kapsamdan bağımsız eklenir; `next_review` boş soru en eski vade sayılır; karıştırma anahtarı `ders|konu`.

## Yeniden üretme
1. Bu turun commit'ini checkout et (SHA: REVIEW-<n>.md başlığı / PR head'i).
2. `ND_ZOD_PATH=/opt/npm-tools/node_modules/zod/index.js npm test`
3. Yalnız yeni testler: `ND_ZOD_PATH=/opt/npm-tools/node_modules/zod/index.js node --experimental-strip-types --import ./tests/reg.mjs --test tests/swipe-*.test.mjs`

## Orkestratör doğrulaması (Tur 1)

- `ND_ZOD_PATH=/opt/npm-tools/node_modules/zod/index.js npm test`: 103/103, çıkış 0.
- Taban dalda (PR 5) `tests/program-render.test.mjs` "gün tamamsa .td-focus.is-done" testi tarihe bağlıydı: fixture örnek soruların `next_review` değeri sabit 2026-11-17; 17 Kasım'dan itibaren bu sorular vadesi gelmiş sayıldığından `allDone` false oluyordu. Üretim kodunda hata yok; test `rows:[]` ve 7 günlük sabit Date ile tarihten bağımsız yapıldı (bu dalda ayrı commit). PR #13'teki aynı test 17 Kasım'dan sonra kırmızıdır.
- Gerçek HTTP/route çalışması, Radix ve `tsc` bu ortamda doğrulanamadı.

## Tur 2 (inceleme 1 bulguları, SKOR 4)
- **ÖNEMLİ: katman donduruldu.** Karıştırma/yazma artık canlı `tierOf`'a değil oturum başında dondurulan `s.tiers`'a bakar; sunucu upsert'i vadeyi kaydırsa da sıra değişmez. Simülasyon (Türev, Limit, İntegral, Limit, Türev, Olasılık, Olasılık; q0'a Bilemedim): upsert'li ve upsert'siz akış aynı sırayı verir: `q0 q1 q2 q4 q3 q5 q0 q6`. Yeniden çıkan q0 kuyrukta 4. konuma girer; q4 (Türev) araya seçildiği ve q0 son iki konuyla (Türev, Limit) çakıştığı için q5'ten sonra gelir. Yani "son iki konudan farklı" kuralı korunur.
- **Yeni/değişen imzalar (K2 bağlanacak):**
  - `type SwipeSession={day,subject,scope,includeLearned,queue,current,history,mark,results,struggle,pending,tiers:Record<string,Tier>}`; `Tier` artık `session.ts`'te tanımlı, `queue.ts` yeniden dışa aktarır.
  - `newSession({...,tiers?})` (varsayılan `{}`); `startSession(rows,today,opts)` tiers'ı doldurur.
  - `pickNext(queue:Question[],recentTopics:string[],tiers:Record<string,Tier>)`; `advance(s,rows:Map)` (today kalktı); `applyResult(s,q,outcome)` ve `leaveCard(s,q)` (today kalktı). Tiers'ta kaydı olmayan kart `B` sayılır (yalnız Bilemedim yazar).
  - `reclassify(s,rows:Map,today):SwipeSession`: yeniden yüklemede (`loadSession` sonrası) sonucu işlenmemiş kuyruk/güncel kartların katmanını satırlara bakarak yeniden hesaplar; sonucu olan kartlar donuk kalır. K2 `loadSession` ardından çağırmalıdır.
  - `restore`/`loadSession`: `tiers` alanı okunur (silinmiş kimlik ve geçersiz değer ayıklanır; eski kayıtta yoksa `{}`).
  - `collectPending(storage,user,today):{day:string;pending:Pending[]}[]`: eski günlerin gönderilmemiş (`tries<3`) yazmaları; depoya dokunmaz. K2, `purgeOldSessions`'tan ÖNCE bunları göndermelidir; "ertesi gün eski anahtar silinir" kuralı aynen duruyor.
- **KÜÇÜK:** `route.ts` `reviewed===true` dalına `!d.markLearned` eklendi (regex testiyle sabit); B sıralamasında `topicHistory` sayısı ders|konu başına bir kez hesaplanır; `server.test` totolojisi `learnedState` anahtar/değer testine çevrildi; `optionLetter("(B)")` doğrudan test; yukarıdaki 102/103 notları 103/103 yapıldı, çift başlık teke indi.
- **Test (Tur 2):** `ND_ZOD_PATH=/opt/npm-tools/node_modules/zod/index.js npm test` → 103 test, 103 geçti, çıkış 0 (`t(...)` durumları: queue 24, session 9, answer 3, server 5).

## Orkestratör doğrulaması (Tur 2)

- `npm test` yeniden koşuldu: 103/103, çıkış 0.

## Tur 3 (küçük kalanlar, inceleme 2 SKOR 5 sonrası)
- `reclassify` koşulu `!s.results[id]?.first`: yalnız atlanmış (ilk sonucu olmayan) kart da yeniden sınıflanır; aksi halde başka pencerede `doğru` alan kart yeniden yüklemede A sayılıp ikinci kez yazılabilirdi. Atlanmış kart için test eklendi.
- `route.ts` `reviewed===false` dalına `&&!d.markLearned` eklendi (markLearned:true + reviewed:false çelişkisinde öğrenildi durumu yarım kalmaz); `swipe-server.test.mjs` regex'i sabitler.
- Ekleme konumu 4/8 (0 tabanlı); gösterim, karıştırma kuralıyla ölçülen aralıkta (1. Bilemedim: 2–11 kart, 2.: 2–17; medyan 4/9) öne/arkaya kayar; sonsuz itme yok (3000 oturum simülasyonu). Testteki "4. konum" = 0 tabanlı indeks 4 (5. sıra).
- **Test (Tur 3):** `ND_ZOD_PATH=/opt/npm-tools/node_modules/zod/index.js npm test` → 103 test, 103 geçti, çıkış 0 (`t(...)` durumları: queue 25, session 9, answer 3, server 5 = 42).

## Orkestratör doğrulaması (Tur 3)

- `npm test` yeniden koşuldu: 103/103, çıkış 0. İnceleme 2 (opus yedek, Fable kredi yok): SKOR 5.
