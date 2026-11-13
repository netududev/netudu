# REVIEW-1 — soru-bankasi-oynatma-listesi

SKOR 4

ÖNEMLİ (zorunlu):
1. app/study-app.tsx (resourceOp ~89), app/study/plan/resources.tsx:35,41, app/api/plan/resources/route.ts:15-27 — İstekler sıraya alınmıyor; sunucu config'i oku-değiştir-yaz yapıyor. Video kutularını art arda işaretlemek / +- hızlı basmak tek sekmede eşzamanlı istek üretir; yazan öncekini ezer, yanıtlar ters sırada gelirse setPlan eski planı geri yükler. Düzeltme: resourceOp içinde promise kuyruğu (useRef(Promise.resolve()); her çağrı öncekini bekler; yalnız en son yanıt planı güncellesin ya da sıra korunduğu için sırayla uygula) + istek sürerken ilgili kartta aria-busy (düğmeleri tamamen kilitlemek zorunlu değil, kuyruk yeterli). Gerekirse playlist işaretleme için iyimser yerel durum.
2. app/api/plan/resources/route.ts:13-14 — fetch-playlist için kullanıcı başına sınır yok; paylaşılan YOUTUBE_API_KEY kotası tüketilebilir. Düzeltme: lib/limits.ts'teki mevcut günlük sayaç mekanizmasından geçir (yeni 'playlist' türü, varsayılan günde 20; mevcut AI_LIMIT_* ortam değişkeni desenine uygun AI_LIMIT_PLAYLIST yapılabiliyorsa onu kullan); aşılınca 429 ve Türkçe "Bugünlük liste getirme hakkın doldu; video sayısını elle gir." mesajı. Mevcut limits API'sini oku ve aynı üslupla kullan.

KÜÇÜK (yap):
3. resources.tsx:41 — <details> kapalıyken de r.total kadar satır render ediliyor. Düzeltme: içeriği open durumuna bağla (onToggle ile state).
4. resources.tsx:41 — onay kutusu aria-label'ı video başlığını eziyor. aria-label'ı kaldır veya başlığı içer (ör. "7. video: Köklü sayılar — izlendi").
5. resources.tsx:40 — "Şu an buradayım" formu istek başarısız olsa da kapanıyor. resourceOp ok döndürsün; yalnız başarılıysa kapat.
6. resources.tsx:70 — Dinlenme (kaydırılmış) gününde yanıltıcı metin; day.isOff için ayrı, dürüst metin ("Bugün dinlenme günü; kaynak payların yarına kalır." gibi — ama gerçekten öyle mi kontrol et: resources.ts unitsFor dinlenme gününü bilmiyor. Ya dinlenme gününde kaynak kotası 0 sayılsın (buildDay zaten koymuyor) ve tahmin buna göre tutarlı olsun, ya da metin gerçeği söylesin. En basit tutarlı çözümü seç ve test ekle.)
7. lib/plan/resources.ts:118-119 — kota üstü +1 sonrası "Geri al" kitapta done'ı kota kadar düşürüyor (16→13). Düzeltme: geri al bugünün log'undaki birimleri geri alsın (done -= log.units, log sıfırlansın) — mevcut mantığı oku, tutarlı ve test edilmiş olsun.
8. app/globals.css:937-938 — `.stat-strip>div:last-child:nth-child(odd)` tüm şeritleri etkiliyor; Kaynaklar sarmalayıcısına daralt.
9. lib/plan/scheduler.ts:143 + app/study/plan/alarm.tsx:24 — çok dolu günde kaynak blokları 1-2 dakikaya iniyor ve alarm çalıyor. Düzeltme: allocateFreeSlots sonucu fitted=false ve süre < 15 dk olan kaynak bloğu çizelgeye/alarma eklenmesin; görev listesinde (DayPlan.resources) kalsın, "boş saat yok" notuyla. Test ekle.
10. Config boyutu: toplam playlist başlığı sayısına üst sınır (tüm kaynaklarda en fazla 1500 öğe) — zod (resource-schema.ts) + API ekleme/getirme yolunda uygula, aşılırsa Türkçe hata.
11. PROOF.md — iddia kutularını gerçek duruma göre işaretle, şablon artığı {komut} yer tutucularını sil, yükleyicileri (reg.mjs/hook.mjs) docs/proof/soru-bankasi-oynatma-listesi/ dizinine kopyala ve "Yeniden üretme" yollarını düzelt. Sonuna "## Tur 2" bölümü: her bulgu → yapılan değişiklik → kanıt (komut + gerçek çıktı).
