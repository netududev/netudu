# REVIEW-2 — foto-soru-gorsel-not (inceleme turu 2, son tur)

## ÖNEMLİ
1. `app/api/questions/[id]/route.ts:14-15` + `app/study/question-dialog.tsx:17,28` — `edited`, gövdede subject/topic alanı bulunduğu için true. Soru diyaloğu "Düzenle" her kayıtta subject/topic gönderdiğinden yalnız cevap anahtarı/hata türü kaydı bile etiketi manual + needsReview:false yapıyor (solve artık düzeltmiyor). Aynı sekmede ders değişince edit.topic sıfırlanmıyor; normalizeTopic eşleşmezse ham metni döndürüyor, "Fizik + Türev" manual kilitleniyor. Düzeltme: (a) "edited" kararı saf yardımcıya (lib/classify.ts): confirm===true || subtopic!==undefined || difficulty!==undefined || ders değişti || konu değişti || sınav türü değişti. (b) question-dialog'da ders değişince topic:'' (Kaydet !edit.topic.trim() ile kapalı; "Konu seç" uyarısı). (c) Sunucuda ders değiştiyse ve gelen konu yeni dersin topicTree'sinde yoksa UNKNOWN_TOPIC + needsReview. Testler: değişmemiş ders+konu + answerKey → classification değişmez; ders değişti + eski konu → UNKNOWN + needsReview.
2. `study-app.tsx:106` + `archive.tsx:14,16-17` + `lib/study.ts:47` — isUnrecognized tutarsız: kenar çubuğu DERSLER sayacı tanınmayanları ilk derse sayıyor (tıklayınca filtre boş); arşiv gruplu görünüm, Excel "Konu özeti" ve exportRows/CSV "Ders" sütunu yer tutucu dersi yazıyor. Düzeltme: kenar çubuğunda some/count için !isUnrecognized(q) + ayrı "Kontrol bekleyenler (N)" satırı → arşivde bu sorulara filtre; arşiv groups'ta "Belirlenmemiş"; exportRows ve Excel özetinde "Belirlenmedi". report.test.mjs'e export ve sayım testleri.

## KÜÇÜK
3. `lib/study.ts:37` — isUnrecognized ders bilinen ama konu belirsiz kaydı da kapsıyor; "Kontrol bekleyenler" filtresi bunu da kapsasın; kısa Türkçe yorum.
4. `app/api/reports/route.ts:12` — ayın tüm soruları tanınmamışsa: "Bu ayın N sorusu henüz tanınmadı; önce ders ve konularını belirle."
5. `app/api/notes/route.ts:9` — maxTokens main'deki değere (6500) geri; 'incomplete' durumunu iade dışı tutmak basitse yap (yalnız ağ/HTTP hatası iade).
6. `archive.tsx:11` — tablo hücresi de hasSolution kullansın.
7. `globals.css ~1001,1018,1028` — baskıda karşılaştırma şemasında başlık üstte, sütunlar tam genişlik; ekranda da aynı sorun varsa düzelt. note-print-dark.png yeniden üretilsin.
8. `globals.css ~931` hero #2A241E / #5C4E31 — kullanıcının onayladığı tasarım rengi; DOKUNMA, PROOF'ta not düş.
9. PROOF.md: eski ölü CSS satırı ve eski test sayıları güncellensin; iddia kutuları gerçek duruma göre; sonuna "## Tur 3".
