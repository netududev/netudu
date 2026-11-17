# KANIT — perf-coz-hizlandir

| Görev | Tür | Aralık | Tur | Yazar modeli |
|---|---|---|---|---|
| Çözme isteğinden video araması ve konu geçmişi sorgusunu çıkar | mantık | 4d785c3..bu turun commit'i | 1 | sonnet |

## İddia
- [ ] `solve/route.ts` artık `findVideos` çağırmıyor ve `SELECT id,subject,topic FROM questions WHERE user_id=?` atmıyor; `topicHistory`/`history` hesabı yok.
- [ ] Kaydedilen analizde `videos` boş dizi, `videoNotice` ve `history` alanı yok; tüketiciler çökmüyor, eski kayıtlar bozulmuyor.
- [ ] Aynı soru, aynı ders+konuyla yeniden çözülünce önceki `videos`/`videoNotice` korunuyor; konu değişince temizleniyor.
- [ ] Tüm test paketi yeşil.

## Önce
Rota kaynağında (4d785c3) `findVideos(...)` (readable ise, ağ: OpenAI web araması/YouTube) ve ek bir `SELECT ... FROM questions WHERE user_id=?` (kullanıcının tüm soruları) çözme isteğinin içindeydi. Yeni test `tests/solve-result.test.mjs` önce `lib/solve-result.ts` yokken kırmızıydı:
`Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../lib/solve-result.ts'`, `# pass 0 / # fail 1`.

## Sonra
`ND_ZOD_PATH=/opt/npm-tools/node_modules/zod/index.js npm test` → `# tests 134 / # pass 134 / # fail 0`, çıkış 0 (7'si yeni).

## Test / Ölçüm
| Komut | Beklenen | Gerçek | Çıkış kodu | Sonuç |
|---|---|---|---|---|
| `npm test` (ND_ZOD_PATH ile) | tüm testler geçer | 134 pass, 0 fail | 0 | PASS |

Tasarım kararları (tüketiciler okunarak):
- `videos:[]` yazılır (tip `videos:Video[]` zorunlu; `solution-card.tsx`, `plan/ui.tsx`, `exportRows`, yazdırma `?.` ile okur). `videoNotice` ve `history` HİÇ yazılmaz: `question-dialog.tsx` AutoVideos koşulu `!vids.length&&!a?.videoNotice` (alan yoksa tetiklenir); `questions/[id]/route.ts` konu değişince zaten `videos=[]` + `delete videoNotice` yapıyor, yani "alan yok" kodda bilinen geçerli durum. `''` de eşdeğer olurdu ama silme deseniyle tutarlılık için alan yok. `history` tipte yok ve istemci kendi hesaplıyor; eski kayıtlardaki `history` alanı okunmuyor, zararsız.
- Yeniden çözüm: önceki analizde `subject`/`topic` yeni değerlerle birebir aynıysa `videos`/`videoNotice` korunur (video önbelleği zaten ders+konu anahtarlı); aksi halde (konu değişti, önceki analizde subject/topic yok, bozuk kayıt, okunamayan soru) temizlenir ve AutoVideos yeniden yükler. Eski kayıtlı analizler yalnız çözme tekrarında bu kurala girer; çözülmeyen kayıtlara dokunulmaz.
- Test, rota içeriğini gerçek OpenAI/DB olmadan çalıştırmak yerine saf fonksiyonu (`buildCombined`) davranış olarak sınar; rotada çağrıların yokluğu ise kaynak taramasıyla sınanır (rota `@/` ve bulut bağlarına bağlı, test düzeninde yüklenemiyor).

## Orkestratör doğrulaması
- `npm test`: 134/134, çıkış 0 (orkestratör bağımsız koştu). Fark 3 satır ekleme/6 silme + 11 satırlık yardımcı okundu.
- Gerçek OpenAI/YouTube/Vercel süresi ölçülemedi; yalnız çağrı sayısı azaldı.

<!-- orkestratör doldurur -->

## Kapsam dışı / bilinen eksikler
- Gerçek OpenAI/YouTube/Vercel süresi ÖLÇÜLEMEDİ (ağ yok); yalnız isteğin içindeki çağrı sayısı azaldı: 1 video araması (OpenAI web araması + olası önbellek yazımı) ve 1 tüm-sorular SELECT'i kaldırıldı. Süre kazancı varsayımdır, ölçüm değildir.
- İlk çözümden sonra Videolar sekmesi açılınca video yüklemesi artık sekmede (AutoVideos) başlar; kullanıcı orada bekleyebilir (kasıtlı takas).
- Başka tüketici (`/api/videos`) videoyu hâlâ `a.videos`/`a.videoNotice` üzerine yazar; değişmedi.
- `tsc` çalıştırılamadı (tip paketleri yok); doğrulama test paketiyle.

## Yeniden üretme
1. Bu turun commit'ini checkout et (SHA: REVIEW-<n>.md başlığı / PR head'i).
2. `ND_ZOD_PATH=/opt/npm-tools/node_modules/zod/index.js npm test`
