# REVIEW-2 — soru-bankasi-oynatma-listesi

ÖNEMLİ (zorunlu):
1. app/api/plan/resources/route.ts:17 — `refund` her hatada çalışıyor; lib/plan/playlist.ts:13,19'daki 404'ler ("liste bulunamadı", "listede video yok") dahil. Var olmayan/özel list= ile yapılan her istek YouTube kotası harcıyor ama hak iade ediliyor → günlük 20 sınırı aşılabiliyor. Düzeltme: iade kararını saf bir yardımcıya çıkar (ör. lib/plan/playlist.ts `shouldRefund(e)`): yalnız kullanıcı kaynaklı olmayan hatalarda iade (ağ, zaman aşımı, YouTube 5xx/403→502 eşlemesi); PlaylistError status 400/404 hak harcar. Test ekle (TDD: önce kırmızı).

KÜÇÜK (yap):
2. app/study/plan/resources.tsx:41 ve :31 — iyimser durum yok; sabırsız ikinci tık ikinci toggle olarak kuyruğa girip işareti geri alıyor; "bitirdim"e çift tık 2×perDay tamamlıyor. Düzeltme: s.resourceBusy[r.id] doluyken o kartın onay kutuları, "bitirdim"/"geri al"/± düğmeleri disabled (aria-busy zaten var). Mümkünse kuyruğu saf bir `makeQueue` yardımcısına çıkar ve node testiyle kanıtla: sıralı çalışma, hata sonrası devam, sayaç azalması.
3. app/study/plan/resources.tsx:30-31 — dinlenme/seçili olmayan günde bugünün log'u doluysa da "Geri al" görünsün.
4. route.ts:15,21 — getirme yalnız toplam ≥1500 iken engelleniyor; 1201–1499 arası kullanıcı hak harcayıp 300 başlık getirip eklemede reddediliyor. Düzeltme: eklemede başlıkları kalan bütçeye kırp (kalanlar "n. video" görünür) ve kullanıcıya kısa Türkçe not; reddetme yok. Test ekle.
5. lib/plan/resources.ts:144 — normalizeResources bütçe kırpmasına tek satır Türkçe yorum.
6. Gelecek dinlenme günleri tahmini (resources.ts:84,93; scheduler.ts:143): basitçe çözülebiliyorsa selectedBetween'e dinlenme tarihleri kümesi geçir + test; yoksa PROOF "bilinen eksikler"e yaz.
7. PROOF.md "Yeniden üretme": check-css.py, class-check.py, icon-audit.mjs ve scheduler/streak/apple .cur.test.mjs dosyalarını docs/proof/soru-bankasi-oynatma-listesi/tools/ içine kopyala (yollar ND_ROOT ile çalışsın), yolları düzelt. Sonuna "## Tur 3" bölümü: bulgu → değişiklik → komut + gerçek çıktı.
