# KANIT — font-ikon-logo

| Görev | Tür | Aralık | Tur | Yazar modeli |
|---|---|---|---|---|
| Tek font ailesi (Manrope), özel simge seti, animasyonlu yükleme logosu, boş durumlar | görsel | a138d62..bu turun commit'i | 1 | sonnet |

## İddia
- [ ] Tüm sitede tek font ailesi (Manrope, next/font/google) kullanılır; Poppins ve diğer aileler kaldırıldı.
- [ ] `lucide-react` içe aktarımı app/ ve components/ altında 0; 109 içe aktarılan ad yeni modülde dışa aktarılıyor.
- [ ] 98 özgün glif, 24x24 ızgara, 1.75 çizgi, tek kaynak (glyphs.ts); 20px ve 48px'te okunur.
- [ ] Yükleme logosu: sekmeler/alt kenar/çerçeve çizilir, kalem ucu, kıvılcım, N, "netudu"; son kare LogoMark ile aynı; reduced-motion'da tam logo.
- [ ] Boş durumlar "Örnek" etiketli iskelet + 3 adımla doldu; yanlış defterinde gerçek veriden özet şeridi.

## Önce
Poppins `@font-face` (public/fonts/*.woff2) + Segoe UI/SF yığını; 42 dosyada `lucide-react`; yükleme ekranı: logo + dönen halka; boş durumlarda tek kart/tek cümle.

## Sonra
Simgeler: ![açık](icons-light.png) ![koyu](icons-dark.png)
Logo film şeridi (0, .3, .6, .9, 1.2, 1.5, 2.0 sn; sağda gerçek LogoMark): ![kareler](logo-frames.png)
Açılış: ![1440](landing-1440.png) ![390](landing-390.png) Boş durumlar: ![1440](empty-1440.png) ![390](empty-390.png)
Not: önizlemelerde ağ olmadığından Manrope yüklenmez; sistem yedek fontu görünür. Tailwind sınıfları statik HTML'de çalışmaz; yalnız düz CSS sınıflı bölümler önizlendi.

## Test / Ölçüm
| Komut | Beklenen | Gerçek | Çıkış kodu | Sonuç |
|---|---|---|---|---|
| `node ts-check.js` (değişen .tsx) | OK | hepsi OK | 0 | PASS |
| `node names-check.js` | temiz | temiz | 0 | PASS |
| `python3 class-check.py` | 0 tanımsız sınıf | 0 | 0 | PASS |
| `python3 check-css.py app/globals.css` | parantez dengeli | dengeli; tanımsız: --d --sp --sy --v (satır içi) ve --font-manrope (next/font) | 0 | PASS |
| `palette-check.py` | boş | boş | 0 | PASS |
| streak / scheduler / apple testleri | geçer | 9/9, 26, 15 | 0 | PASS |
| grep `lucide-react` app components | 0 | 0 | - | PASS |
| içe aktarılan simge adı ⊂ dışa aktarılan | eksik yok | eksik yok (109 ad) | - | PASS |
| `next build` | - | YAPILAMADI (ağ yok); next/font/google derlemesi doğrulanamadı | - | YAPILAMADI |

## Orkestratör doğrulaması
(orkestratör doldurur)

## Kapsam dışı / bilinen eksikler
- Gerçek tarayıcıda uygulama çalıştırılamadı; Manrope yüklemesi doğrulanamadı.
- Madde 4 kısmi: boş durumlar (program, deneme, yanlış defteri, rapor, not) ve yanlış defteri özet şeridi eklendi; açılış sayfası mevcut yapısıyla bırakıldı; ayarlar/denemeler/notlar için ek şerit eklenmedi (denemelerde zaten özet var).
- Yükleme ekranı en az gösterim süresi yok: yalnız 100 ms gecikmeli belirir; içerik gelince ani kapanır (içerik animasyonları devreye girer).
- Doğrulama sonrası eklenen fallback `var(--font-manrope,Manrope)`; e-posta HTML'inde font-family sistem yığınıdır (web fontu e-postada çalışmaz).

## Yeniden üretme
1. Bu turun commit'ini checkout et.
2. Betikler scratchpad'de: icons-preview.mjs, logo-frames.cjs, pages.cjs.

## Orkestratör doğrulaması (tur 1)
- Görüntülere bakıldı: `logo-frames.png` (sıra: sekmeler → çerçeve → kalem ucu → N → yazı; son kare gerçek LogoMark ile aynı), `icons-light.png` (98 glif, 20 ve 48px okunur, taşan/boş yok), `empty-1440.png` ve `empty-390.png` (iki sütun → tek sütun, taşma yok).
- `check-css.py`: parantez farkı 0; tanımsız yalnız `--d --sp --sy --v` (satır içi) ve `--font-manrope` (next/font tanımlar).
- `ts-check.js`: 0 sözdizimi hatası. `names-check.js`: temiz (taban koddaki D1/R2 tip uyarıları hariç).
- Simge dışa aktarım denetimi (ayrı betik): 109 dışa aktarım, içe aktarılıp eksik kalan ad 0.
- `lucide-react` içe aktarımı: 0 dosya. Poppins kalıntısı: 0.
- Testler: streak 9/9, scheduler+pricing 26, apple 15.
- YAPILAMADI: `next build` (next/font/google indirmesi yalnız Vercel derlemesinde sınanır), gerçek uygulamanın tarayıcıda çalıştırılması, Manrope'nin görsel kontrolü (önizlemeler yedek fontla).
- Gözlem: simge seti tutarlı ve temiz, ancak imza motifi zayıf; genel çizgi simge setlerine yakın duruyor.
