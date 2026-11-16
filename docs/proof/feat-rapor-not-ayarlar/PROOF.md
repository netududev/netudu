# KANIT — feat-rapor-not-ayarlar

| Görev | Tür | Aralık | Tur | Yazar modeli |
|---|---|---|---|---|
| PR 6: Aylık rapor, Denemeler, Ders notları, Ayarlar (sekmeli), .env.example | görsel + mantık (karma) | 0841c99..bu turun commit'i | 1 | sonnet |

## İddia
- [x] Aylık rapor: ay seçici sayfa başlığının sağında, "Yazdır / PDF"in solunda ikincil; gövdede tek birincil ("Notları hazırla").
- [x] Denemeler: tek birincil "Deneme ekle" başlığın sağında (mobilde de görünür); form "Kaydet" ikincil ve ad+net boşken pasif; liste mobilde kart; özet kartları 390'da alt alta.
- [x] Grafikler: çizgi kobalt (`var(--brand)`), çubuk nötr gri (`var(--fg3)`); sabit renk kodu yok. Rapor sıralama çubukları kobalt.
- [x] Ders notları: not okuma genişliği ≤760px; alttaki iki eylem ("Notu yeniden hazırla", "Baştan üret") eşit genişlikte (254+254px @1440); görsel not planın tanımıyla uyumlu.
- [x] Ayarlar: 5 sekme (Profil, Üyelik, Veri, Hesap, yalnız geliştiricide Geliştirici); 13 bölüm planın dağılımıyla; başlıklar cümle düzeninde, "&"/"Developer" yok.
- [x] Seçili sekme `useState` + `resolveTab` ile türetilir (effect yok); geliştirici olmayan hesapta "developer" seçimi Profil'e düşer.
- [x] Kaydet bölümün sağ altında; Profil'de yalnız değişiklik varken etkin (`isProfileDirty`), geliştirici formlarında yalnız anahtar girilince etkin.
- [x] Ayar ekranlarında en çok 1 birincil (önce Profil sekmesinde 2-4 idi); Profil dışı sekmelerde 0.
- [x] 60 ekran görüntüsü (1440/390 x açık/koyu): yatay taşma yok (sw==cw), kırpılan düğme yok, dokunma hedefi ≥44px, birincil ≤1.
- [x] .env.example koddaki değişkenleri açıklamalı listeler (gizli değer yok).

## Önce
Taban 0841c99 (feat/program-ve-kaynaklar) geçici --detach worktree'sinden, aynı betikle: `rapor-1440-acik-onceki.png`, `denemeler-390-acik-onceki.png`, `ayarlar-profile-gelistirici-1440-acik-onceki.png`, `ayarlar-profile-normal-390-acik-onceki.png`.
Ölçüm (önceki, logdan): Ayarlar/Profil geliştirici hesabı birincil sayısı 4, normal hesap 2 ("Programı oluştur", "Kaydet"); 14 bölüm tek sayfada. Rapor/Denemeler 1 birincil, ancak ay seçici gövdede, Denemeler'de "Kaydet" birincil tam genişlik. Not: "önceki" Notlar görüntüsünde seçili not yoktur (eski bileşen `initialSelected` almaz), bu yüzden Notlar için önce/sonra kıyası yok.
![](rapor-1440-acik-onceki.png) ![](denemeler-390-acik-onceki.png) ![](ayarlar-profile-gelistirici-1440-acik-onceki.png)

## Sonra
![](rapor-1440-acik-sonraki.png) ![](rapor-390-koyu-sonraki.png) ![](denemeler-1440-acik-sonraki.png) ![](denemeler-390-acik-sonraki.png) ![](notlar-1440-acik-sonraki.png) ![](notlar-390-acik-sonraki.png) ![](ayarlar-profile-gelistirici-1440-acik-sonraki.png) ![](ayarlar-profile-normal-390-koyu-sonraki.png) ![](ayarlar-membership-normal-390-koyu-sonraki.png) ![](ayarlar-data-normal-1440-acik-sonraki.png) ![](ayarlar-account-gelistirici-390-acik-sonraki.png) ![](ayarlar-developer-gelistirici-1440-koyu-sonraki.png) ![](ayarlar-developer-gelistirici-390-acik-sonraki.png)
Tam ölçüm: `olcum-sonraki.json` (60 ekran: rapor, rapor-bos, denemeler, denemeler-bos, notlar, notlar-bos, ayarlar x 5 sekme x (normal|geliştirici), 1440/390, açık/koyu).

## Test / Ölçüm
| Komut | Beklenen | Gerçek | Çıkış kodu | Sonuç |
|---|---|---|---|---|
| `ND_ZOD_PATH=/opt/npm-tools/node_modules/zod/index.js npm test` | tümü yeşil, atlanan yok | 99 test, 99 geçti, 0 kaldı, 0 atlandı (85 + 14 yeni) | 0 | PASS |
| `node scripts/rapor-preview.mjs` (MODE=sonraki) | 60 ekranda sw==cw, kırpılan/küçük hedef yok, birincil ≤1 | 60/60 temiz | 0 | PASS |

## Kapsam dışı / bilinen eksikler
- Radix Tabs/menüleri gerçek tarayıcıda doğrulanamadı; önizleme düz karşılık kullanır (ui-stubs). Sekme tıklaması, klavye gezinmesi, odak halkası ve `[role=tab]` stilinin Radix çıktısında tutması Vercel önizlemesinde teyit edilmeli.
- recharts önizlemede düz kutu: çizgi/çubuk renkleri yalnız kaynak testiyle doğrulandı, gerçek çizim görülmedi.
- Plandaki "Benzer 3 soru çöz" / "Yanlış soruma dön" eylemleri kodda yok (uydurulmadı); eşit genişlik mevcut iki eyleme ("Notu yeniden hazırla", "Baştan üret") uygulandı; ikisi de ikincil (ekranda tek birincil sol paneldeki "Notu hazırla").
- Denemeler'de gerçek bir tablo yok (liste); masaüstünde satır, mobilde kart olarak düzenlendi.
- Gerçek veri akışı (kaydetme çağrıları, /api yanıtları) SSR önizlemede çalışmaz; yalnız kod okuma + dokunulmadığı için değişmedi iddiası.
- Metin kontrastı 4,5:1 bu turda ölçülmedi (mevcut jetonlar kullanıldı).
- Tip denetimi (tsc) çalıştırılmadı (PR 7).

## Yeniden üretme
1. Bu turun commit'ini checkout et.
2. `ND_ZOD_PATH=/opt/npm-tools/node_modules/zod/index.js npm test`
3. `ND_ROOT=$PWD SRC_ROOT=$PWD MODE=sonraki OUT=<dizin> PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node scripts/rapor-preview.mjs`

## Orkestratör doğrulaması (Tur 1)

- `ND_ZOD_PATH=/opt/npm-tools/node_modules/zod/index.js npm test` yeniden koşuldu: 99/99, çıkış 0.
- Radix sekmeleri/menüleri, recharts ve `tsc` bu ortamda doğrulanamadı; Vercel önizlemesinde teyit gerekir.

## Tur 2 (inceleme 1, SKOR 4 bulguları)
- Kök neden: eşit genişlikli 2 sütunlu `.note-actions` grid'i ve `flex:1 1 auto` ay seçici 390px'te düğmeleri daraltıp metni 2-3 satıra kırdı.
- Düzeltme (yalnız CSS, `@media(max-width:480px)`): `.note-actions` tek sütun; rapor başlığında ay seçici ve "Yazdır / PDF" tam genişlikte alt alta, `white-space:nowrap`, `min-width:0`. Ayarlar sekmelerinin iç boşluğu 480 altında `--s3`'e düşürüldü (geliştirici hesabında 5. sekme hâlâ yatay kaydırmayla ulaşılır, kısmen kırpık görünür).
- Küçükler: `ReportView`'dan ölü `setMonth` parametresi kaldırıldı; önizleme betiği (aynı iki dal, boş `extra`, yarım yorum) ve testteki `const skip=false` temizlendi; ölü `.report-toolbar>.text-button` kuralı ve 20-mobil-ve-tema.css'teki `.settings-grid` seçici öğesi kaldırıldı (50-v10-v11.css ve 68. satırdaki `.settings-grid` kuralları başka dosyalarda olduğu için dokunulmadı).
- Ölçüm: `scripts/rapor-preview.mjs`'e `kirikDugme` (düğme yüksekliği > 56px; `.note-list` kartları ve `.segmented` düğmeleri, tasarım gereği çok satırlı/ikonlu olduğundan hariç) denetimi eklendi: 60/60 ekranda kırık düğme 0, taşma 0, kırpılan 0, küçük hedef 0. notlar-390 eylem genişlikleri 282/282, rapor-390 başlık eylemleri 358/358.
- Test: `npm test` 99/99 yeşil, çıkış 0. PNG'ler yenilendi; notlar-390, rapor-390, ayarlar-developer-gelistirici-390 gözle kontrol edildi.
- Bilinen küçük sapmalar (kod değiştirilmedi): Supabase bölüm kaydetme sırası planla birebir değil; ayarlar form kırılma noktası 650px, notlar yerleşimi 1000px (planlanan tek değerden farklı).

## Orkestratör doğrulaması (Tur 2)

- `npm test` yeniden koşuldu: 99/99, çıkış 0; 60 ekranda kirikDugme/taşma/küçük hedef boş (yazar ölçümü).
