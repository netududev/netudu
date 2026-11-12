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


## Tur 2 (inceleme turu 1 bulguları)

### Düzeltmeler
- **ÖNEMLİ-1 simge imzası**: `components/icons/glyphs.ts` baştan yazıldı; üç kural tüm sete uygulandı ve dosya başındaki yorumda anlatıldı (Lucide path verisi kopyalanmadı).
  - K1 kalem ucu köşesi: `F()` yardımcısı (üç köşe r=3.5, sağ alt 45 derece pah, 4.5 birim). 23 simge. Pahın içine iç öğe taşmaması için ImagePlus, Images, House, Printer, NotebookPen, CalendarClock, Building2 yeniden yerleştirildi.
  - K2 mürekkep noktası: `D()` = `class="nd-ink"`, r=1.3, simge başına en fazla 1 (denetimde ink>1: yok; ink=1: 45 simge). Eski çoklu nokta kümeleri (Building2 pencereleri, CalendarDays günleri, List madde imleri) çizgiye çevrildi. GripVertical/MoreHorizontal noktaları içeriğin kendisi olduğundan nd-ink değil (`Dp`).
  - K3 defter sekmeleri: FileText, FileSpreadsheet, NotebookPen (sol kenardan 1.5 birim taşan 3 sekme), Copy ön yaprağı (2 sekme). Kıvrık köşeli klasik dosya formu kaldırıldı.
  - CSS (`app/globals.css` sonu): `.nd-ink{fill:var(--icon-ink,currentColor)}`; `--icon-ink:var(--brand-ink)` seçili gezinme öğesi, `.empty-ico`, `.lp-plan` (fiyat kartı), `.target-card`. Not: koyu temada `--brand` #3454D1 koyu zeminde zayıf kaldığı için okunur ton olan `--brand-ink` (#8DA2F2) kullanıldı; açık temada ikisi aynı.
  - Gözle-düzelt turları: Tur A (48px, açık) bulgusu: Building2 pencere çizgileri kalabalık/kapı çok küçük, Copy arka yaprağı ön yaprağa yapışıp topak gibi, FileSpreadsheet iç ızgarası 20px'te bulanık. Düzeltildi (pencere 2 uzun çizgi, Copy arka yaprağı açık L, tablo tek kırık çizgi ızgarası). Tur B (48px koyu + accent + 20px büyütülmüş kırpma): K1 pahı tüm çerçevelerde aynı konumda ve ölçüde; K2 tek ve yerinde (saat merkezi, ok kuyruğu, mercek sapı, zil tokmağı, hedef merkezi, kalem ucu); 20px'te bulanan simge görülmedi (CalendarDays en yoğunu, okunuyor).
- **ÖNEMLİ-2**: `app/study/plan/ui.tsx` adım 1 "Okul, dershane ve günlük çalışma aralığını gir." (sihirbazda uyku alanı yok). Adım 3 de gerçek ekrana göre düzeltildi: "Başlangıç tarihi ve hatırlatmayı seç, ilk haftayı önizle." (eski "Özeti gör, programı başlat" sihirbazda özet ekranı yok).
  Tüm boş durum adımları gerçek alanlarla karşılaştırıldı:
  - plan/ui adım 1: sihirbaz adım 1 = okul (gün, başlangıç, bitiş, ad), diğer sabit saatler (dershane/özel ders/kurs), günlük çalışma aralığı (en erken/en geç). Düzeltildi. Adım 2 tempo seçimi: var. Adım 3: düzeltildi.
  - exams: "adını, tarihini ve netini gir": form alanları Deneme adı, Tarih, Sınav, Net, Doğru, Yanlış, Boş: tamam. "İkinci denemeyle gelişim çizgin": grafik `netData.length>=2`: tamam. "Yanlışların denemeye göre dağılımı yanına eklenir": ayrı bir "Denemelere göre yanlış sayın" grafiği var ama "dağılım/yanına" belirsizdi; "Denemelere göre yanlış sayın ayrı bir grafikte görünür." yapıldı.
  - report: "Yanlışlarını deneme sonrası defterine ekle", "sayıya göre sıralanır", "geçen aya göre değişim" (`delta(t)` okları): tamam, değişiklik yok.
  - notes: "Ders ve Maarif konusunu seç" (Ders + Konu seçicileri), "Notu hazırla" düğmesi: tamam. "Notu kısalt, genişlet" düğmeleri yoktu; gerçek özellik "Notu değiştir" metin kutusu (örn. "daha kısa olsun"), Yazdır ve yanlışlara git: düzeltildi.
  - archive: yalnız örnek iskelet, adım listesi yok.
- **3 başlık kademesi**: genel h1/h2/h3/h4 kuralları `@layer base` içine alındı ve çakışan iki ölü yinelenen kural (satır 6 ve 286'daki çıplak h1/h2) silindi. Gerekçe: Tailwind v4 yardımcıları `@layer utilities` içindedir; katmansız her kural, `:where()` ile özgüllüğü sıfır bile olsa, katmanlı yardımcıyı yener. Yalnız `:where()` yetmez; katman gerekir. Preflight aynı katmanda `(0,0,1)` olduğundan base içinde `:where` kullanılmadı (sıra kazanır). Basamaklama doğrulaması (Playwright, gerçek `globals.css`, Tailwind katmanı benzetimiyle):
  - Önce (HEAD) 390px: h1 28.25px (1.9rem kuralı kaybediyordu), h2 20px (1.08rem kaybediyordu).
  - Sonra 390px: h1 30.4px (=1.9rem), h2 17.28px (=1.08rem). 1440px: tüm başlıklar önceki değerlerle birebir aynı (h1 40px/700, h2 20px/650, h3 16px/650).
  - Dialog başlığı benzetimi `text-lg leading-none font-semibold`: 1440px 18px/600/line-height 18px (yardımcılar kazanıyor; önce v12 kuralı 20px/650 veriyordu). 390px'te katmansız mobil `h2{1.08rem}` kuralı text-lg'yi yener (17.28px), bu kasıtlı mobil kural.
- **4**: `SampleSkeleton` varsayılan etiketi "Önizleme" ("ÖRNEK Örnek önizleme" yinelemesi bitti); `Empty` `sampleLabel` aldı: exams "Net gelişimi", report "Konu sıralaması".
- **5**: `.settings-icon svg{width:22px;height:22px}`.
- **6**: yükleme logosu animasyonu 1.75 sn -> ~1.15 sn (tüm süre/gecikmeler x0.66: sekmeler .03+i*.06 -> çerçeve .1/.5 sn -> uç .58 -> N .75 -> yazı .86). Sıra korunmuş. `logo-frames.png` yeniden üretildi (kareler 0, .2, .4, .6, .8, 1.0, 1.3 sn): 0.2'de sekmeler, 0.4'te çerçeve+alt kenar, 0.6'da çerçeve tamam, 0.8'de uç/N başlıyor, 1.0 ve 1.3'te tam logo + yazı. Gösterim süresi için JS eklenmedi.
- **7**: `package.json` / `lucide-react` bağımlılığına dokunulmadı (kilit dosyası; kodda içe aktarım 0, kaldırma kararı sonraya).

### Kural tablosu (98 simge)
| Kural | Adet | Simgeler |
|---|---|---|
| K1 + K2 + K3 | 2 | FileText, NotebookPen |
| K1 + K2 | 10 | CalendarClock, CalendarDays, Camera, ExternalLink, FolderTree, House, ImagePlus, Images, LogIn, Printer |
| K1 + K3 | 2 | Copy, FileSpreadsheet |
| K1 | 9 | Building2, CalendarPlus, LayoutDashboard, Mail, Monitor, PanelLeft, Table2, Terminal, Trash2 |
| K2 | 33 | AlarmClock, AlarmClockOff, AlertCircle, AlertTriangle, ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Bell, BellRing, ChartNoAxesCombined, Check, CircleCheck, CircleHelp, Clock, Download, History, Info, KeyRound, List, LogOut, Map, School, Search, Send, ShieldAlert, ShieldCheck, Target, TrendingDown, TrendingUp, Undo2, Upload, Wand2 |
| yok | 42 | BookOpen, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Circle, Coffee, Database, DatabaseBackup, Dna, Eye, EyeOff, Flag, Flame, FlaskConical, Globe, GraduationCap, GripVertical, Loader, Menu, Minus, Moon, MoreHorizontal, OctagonX, Pin, Play, Plus, PlusCircle, RefreshCw, RotateCcw, Settings, Sigma, Sparkles, Sun, ThumbsDown, Umbrella, Unplug, UserPlus, UserRound, Users, X, Zap |

Not: LogOut (sol açık ayraç, sağ alt köşe yok), Shield*, Search, Pin vb. çerçevesiz olanlar K1 dışındadır. FolderTree artık çerçeveli bir panel içinde ağaç çizgisi (K1+K2). LayoutDashboard'da yalnız dış alt-sağ kutu pahlıdır (diğer üç iç kutu r=2.5 düz).

### Gerçek komut çıktıları
```
python3 check-css.py app/globals.css
  süslü parantez: açık-kapalı farkı = 0 | en düşük derinlik = 0
  parantez ( ) farkı = 0
  tanımlı değişken: 127 | kullanılan: 100 | TANIMSIZ: ['--d', '--font-manrope', '--sp', '--sy', '--v']
node ts-check.js (ui, shared, exams, notes, report, glyphs, index)  -> hepsi OK
node names-check.js (aynı dosyalar)  -> TEMİZ: tanımsız ad / kullanılmayan değişken-import yok
python3 class-check.py  -> TANIMSIZ SINIF SAYISI: 0
python3 palette-check.py -> çıkış 0 (çıktı yok)
streak: 9/9 PASS            (çıkış 0)
scheduler+pricing: 26 test geçti (çıkış 0)
apple: 15 test geçti        (çıkış 0)
simge denetimi (icon-audit.mjs): dışa aktarılan: 109 | içe aktarılan ad: 109 | EKSİK: [] | bilinmeyen glif: []
  geçerli XML dışı: [] | glif sayısı: 98 | ink>1: [] | ink=1: 45 | ink=0: 53
  güvenli kenar <1 (stroke dahil): Bell, BellRing 0.62 (yanlış alarm: tokmak dolu nokta, strokesuz; gerçek boşluk 1.5)
```

### Görüntüler
- `docs/proof/font-ikon-logo/icons-light.png`, `icons-dark.png` (48px + 20px, 98 simge)
- `docs/proof/font-ikon-logo/icons-accent.png` (48px, nokta `--icon-ink` kobalt; sol yarı açık tema, sağ yarı koyu tema, iki yarıda farklı simgeler görünür)
- `docs/proof/font-ikon-logo/logo-frames.png`

### Bilinen eksikler (tur 2)
- `next build` ve gerçek uygulamada Tailwind çıktısı çalıştırılamadı (node_modules yok); katman basamaklaması Tailwind katman sırası benzetimiyle doğrulandı.
- Seçili gezinme öğesi, `.empty-ico`, fiyat kartında kobalt noktanın gerçek sayfada görünümü bakılmadı; yalnız simge ızgarasında `--icon-ink` ile bakıldı.
