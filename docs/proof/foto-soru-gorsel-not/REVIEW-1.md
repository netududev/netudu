# REVIEW-1 — foto-soru-gorsel-not (SKOR 4)

## ÖNEMLİ
1. `app/study/tag-review.tsx:22` + `app/api/questions/[id]/route.ts:11,19-20` — Düzenlemede ders değişince `draft.topic` boşalır ve gönderilmez; PATCH `topic=String(row.topic)` ile eski dersin konusunu yeni dersin altında bırakır (Fizik + "Türev"). Konu "Konu belirlenmedi" iken yalnız zorluk seçip Kaydet de mümkün. İki durumda `confirm:true` kaydı manual + needsReview:false yapar → rozet kalkar, solve manual olduğu için düzeltmez, yanlış etiket kalıcı. Düzeltme: ders değişip konu gelmediyse topic=UNKNOWN_TOPIC; sonuç konu UNKNOWN_TOPIC ise manual yerine needsReview:true (source none/ai); UI'de konu boşken Kaydet devre dışı + "Konu seç" uyarısı; karar mantığı saf yardımcı + test.
2. `lib/note-format.ts:6-25` + `app/api/notes/route.ts:29` — Şema uzunluk aşımını reddediyor (241 karakterlik adım tüm steps'i atar, uzun oneLiner notu null yapar, boş tek mistakes öğesi listeyi atar) → sık 502. parse null olunca 502 charged=true iken iade ediliyor; studentRequest ile kullanıcı kotasız tekrarlatabilir. Düzeltme: s(max)=trim+min(1)+slice(0,max) (kırp); liste öğelerini tek tek doğrula; istemde uzunluk sınırları; model çağrısı dönünce iade yok (yalnız ağ/OpenAI hatasında iade). Üç durum için test.
3. `app/globals.css` (.nv-layer, .nv-card, .nv-col, .nv-flow li, .nv-cycle li, .nv-lead; print) — Koyu temada Yazdır: siyah kutuda siyah yazı. Düzeltme: `@media print` içinde `#print-note` için açık tema değişkenleri; .nv-lead okunur; koyu temada `emulateMedia print` görüntüsü note-print-dark.png.
4. `app/study/upload-dialog.tsx:58` — Etiket adımında Esc/dış tık/X → onClose(); finish() çalışmıyor, çözüm kuyruğu başlamıyor (regresyon). Düzeltme: step==='tag' ise finish(); iki kez çalışmasın.
5. `app/study/question-dialog.tsx:25` — `a?'Çözümü yeniden hazırla'` yalnız classification içeren analysis'te "yeniden" diyor. Koşulu çözüm varlığına bağla; aynı hatalı varsayım başka yerde (archive, study-app, export) varsa düzelt.
6. `lib/question-defaults.ts:26`, `lib/study.ts:36 monthlyTopics`, `app/api/reports/route.ts:15` — Tanınamayan sorular subjects[0] + "Konu belirlenmedi" ile aylık rapor/AI rapor yükü/ders filtresinde ilk derse sayılıyor. Düzeltme: needsReview && topic===UNKNOWN_TOPIC satırları ayrı "Belirlenmemiş" grubunda ya da dışarıda; raporda "N soru henüz tanınmadı" notu; test.

## KÜÇÜK
7. solve route: okunabilir sonuç + ders/konu yazıldıysa (source none/ai) needsReview:false; ders değiştiyse alt konu boşalt.
8. `landing-hero.tsx:16,20`: "Tekrar: 3 gün sonra" → "Tekrar: yarın", takvimde 1 vurgulu.
9. `note-visual.tsx:17,33`: key indeks tabanlı.
10. `upload-dialog.tsx:25`: unmount'ta ObjectURL revoke.
11. `upload-dialog.tsx:38`: program ön ayarında konu çözülemese de dersi ve deneme adı gönderilsin (hinted mantığı).
12. `globals.css`: ölü .lp-preview/.lp-card sil; .lp-sheet rengi #F3EEE3; useScrollFx'te okunmayan --sy yazımını kaldır.
13. `note-format.test.mjs`: kod çitli/ön sözlü yanıt için ilk "{"–son "}" ayıklaması (parseModelNote) + test.
