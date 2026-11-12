---
name: netudu
description: Gece laciverti ve gök mavisi çalışma arayüzü; tek mavi eylem rengi, üç ölçülü rol tonu; açık ve koyu tema aynı jeton adlarıyla.
colors:
  sky-brand: "#38B6FF"
  sky-brand-hover: "#62C6FF"
  azure-brand: "#0B74C9"
  azure-brand-hover: "#095FA6"
  on-brand-dark: "#101722"
  on-brand-light: "#FFFFFF"
  night-bg: "#101722"
  night-surface: "#192333"
  night-inner: "#223047"
  night-inner-2: "#2B3B55"
  night-line: "#354761"
  night-line-strong: "#43587A"
  night-ink: "#F5F7FC"
  night-ink-secondary: "#B8C5D8"
  night-ink-tertiary: "#8D9DB5"
  night-brand-soft: "#172C42"
  night-brand-line: "#2A4C6E"
  night-selected: "#22446A"
  night-deep: "#1B3F66"
  day-bg: "#F5F8FC"
  day-surface: "#FFFFFF"
  day-inner: "#EFF3F9"
  day-inner-2: "#E3EAF4"
  day-line: "#DCE4EF"
  day-line-strong: "#C2CFE0"
  day-ink: "#0F1A2B"
  day-ink-secondary: "#43546C"
  day-ink-tertiary: "#62738C"
  day-brand-soft: "#E4F1FC"
  day-brand-line: "#B9D8F2"
  day-selected: "#DCEBFA"
  day-deep: "#0F4C86"
  coral: "#E5622F"
  coral-dark: "#FF875C"
  coral-fg: "#C2491B"
  coral-bg: "#FFE9E0"
  coral-bg-dark: "#3A2420"
  mint: "#14A877"
  mint-dark: "#35D6A0"
  mint-fg: "#0B7A57"
  mint-bg: "#DDF6EC"
  mint-bg-dark: "#12312B"
  sun: "#D9A100"
  sun-dark: "#FFC857"
  warn-fg: "#7A5600"
  warn-bg: "#FFF4D6"
  warn-bg-dark: "#33290F"
  bad-fg: "#B3342B"
  bad-fg-dark: "#FF8D8D"
  bad-bg: "#FDE7E4"
  bad-bg-dark: "#3A1E26"
  info-fg: "#0B5FA6"
  info-fg-dark: "#7CCBFF"
typography:
  display:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.3rem, 6.4vw, 4.9rem)"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.8rem, 3.8vw, 2.8rem)"
    fontWeight: 600
    lineHeight: 1.12
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.12rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  body:
    fontFamily: "'Segoe UI', Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  app-heading:
    fontFamily: "'Segoe UI', Arial, sans-serif"
    fontSize: "2.2rem"
    fontWeight: 650
    lineHeight: 1.25
    letterSpacing: "-1.2px"
  label:
    fontFamily: "'Segoe UI', Arial, sans-serif"
    fontSize: "0.85rem"
    fontWeight: 600
    lineHeight: 1.4
rounded:
  sm: "8px"
  md: "10px"
  lg: "12px"
  xl: "14px"
  panel: "18px"
  pill: "999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "20px"
  lg: "25px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.azure-brand}"
    textColor: "{colors.on-brand-light}"
    rounded: "{rounded.md}"
    padding: "11px 22px"
  button-primary-hover:
    backgroundColor: "{colors.azure-brand-hover}"
  button-primary-dark:
    backgroundColor: "{colors.sky-brand}"
    textColor: "{colors.on-brand-dark}"
    rounded: "{rounded.md}"
    padding: "11px 22px"
  button-primary-dark-hover:
    backgroundColor: "{colors.sky-brand-hover}"
  button-secondary:
    backgroundColor: "{colors.day-surface}"
    textColor: "{colors.day-ink}"
    rounded: "{rounded.sm}"
    padding: "9px 13px"
  card:
    backgroundColor: "{colors.day-surface}"
    textColor: "{colors.day-ink}"
    rounded: "{rounded.lg}"
    padding: "25px"
  card-dark:
    backgroundColor: "{colors.night-surface}"
    textColor: "{colors.night-ink}"
    rounded: "{rounded.lg}"
    padding: "25px"
  preview-frame:
    backgroundColor: "{colors.day-surface}"
    rounded: "{rounded.panel}"
  preview-frame-dark:
    backgroundColor: "{colors.night-surface}"
    rounded: "{rounded.panel}"
  nav-item-selected:
    backgroundColor: "{colors.day-selected}"
    textColor: "{colors.day-ink}"
    rounded: "{rounded.sm}"
    padding: "10px 12px"
  nav-item-selected-dark:
    backgroundColor: "{colors.night-selected}"
    textColor: "{colors.night-ink}"
    rounded: "{rounded.sm}"
    padding: "10px 12px"
---

# Design System: netudu

## Overview

**Creative North Star: "Gece Defteri"**

netudu, gece lambasının altında açılmış düzenli bir çalışma defteri gibi davranır: koyu lacivert zemin, ince mavi-gri çizgiler, tek bir gök mavisi eylem rengi. Ürünün kendisi (program, net grafiği, yaklaşan deneme) landing'in ilk ekranında tam ölçekli bir panel olarak durur; süs yerine okunabilirlik gelir. Yüzeyler düz ve tonlu katmanlıdır; gölge yalnız çerçeveli büyük panellerde ve landing dolu düğmesinde yumuşak bir derinlik verir.

Sistem tek bir jeton kümesinden iki tema üretir: açık (varsayılan, mavi aileden türetilmiş) ve koyu (cihaz tercihi ya da `[data-theme=dark]` ile elle seçim). Her bileşen jetonu adıyla okur (`--bg`, `--surface`, `--inner`, `--line`, `--fg`, `--brand`, `--mint`, `--coral`, `--sun`); hiçbir bileşen tema adı bilmez. Landing (`.lp-*`) yeni dili taşır; giriş sonrası uygulamanın yerleşimi eski düzenini korur, yalnız jeton katmanı mavi aileye geçmiştir.

**Key Characteristics:**
- Mavi eylemdir: açıkta #0B74C9, koyuda #38B6FF; düğme, bağlantı, seçili durum, odak halkası.
- Üç rol tonu, her birinin tek işi var: nane ilerleme ve tamamlanma, mercan ders ayrıntısı, güneş sarısı takvim vurgusu.
- Başlıklar Manrope 700, sıkı aralıklı (-0.02em); gövde ve arayüz de aynı aile (400/500).
- 1px çizgiler, 8 ile 18px köşe; landing metninde gradyan ve cam yok.
- Hareket azaltma tercihi tüm animasyon ve geçişleri kapatır.

## Colors

Mavi-lacivert nötrler üzerinde tek mavi eylem rengi; üç rol tonu ve durum renkleri ölçülü kullanılır. Değerler `app/globals.css` "Tema jetonları" bloklarından alınmıştır; tema anahtarı yalnız bu blokta değer değiştirir.

### Primary
- **Gök Mavisi** (`sky-brand`, koyu tema `--brand`): düğme dolgusu, bağlantı, seçili durum, odak halkası, grafik çizgisi. Hover `sky-brand-hover`; üzerindeki metin `on-brand-dark` (gece zemin rengi).
- **Lacivert Mavi** (`azure-brand`, açık tema `--brand`): aynı rolün açık karşılığı; hover `azure-brand-hover`, üzerindeki metin beyaz. Rol jeton adıyla (`--brand`) çözülür.

### Secondary
- **Nane** (`mint` açık, `mint-dark` koyu; metin çifti `mint-fg`, zemin `mint-bg`): ilerleme çubukları, tamamlandı onayı, "iyi" durum rozeti.
- **Mercan** (`coral` açık, `coral-dark` koyu; `coral-fg`, `coral-bg`): ders ayrıntısı; ders adı (`.dc-subj`), konu rozeti, özellik noktası.

### Tertiary
- **Güneş Sarısı** (`sun` açık, `sun-dark` koyu; uyarı çifti `warn-fg`, `warn-bg`): takvim vurgusu; bugünün gün kartı kenarı, deneme tarih kutusu, izin günü.

### Neutral
- **Gece / Gündüz Zemin, Yüzey, İç Panel** (`night-bg`, `night-surface`, `night-inner`, `night-inner-2`; açıkta `day-*` karşılıkları): sayfa, kart, iç alan, çubuk izi.
- **Çizgiler** (`*-line`, `*-line-strong`): kart kenarı ve ayraç; güçlü çizgi girdi ve onay kutusu kenarı.
- **Metin üçlüsü** (`*-ink`, `*-ink-secondary`, `*-ink-tertiary`): birincil, ikincil, üçüncül (yer tutucu, numara, eksen etiketi).
- **Seçili menü** (`*-selected`): kenar çubuğu aktif satırı. **Yumuşak mavi** (`*-brand-soft`, `*-brand-line`): bilgi şeritleri, seçili kartlar, rozetler. **Derin mavi** (`*-deep`): koyu teşvik kartı zemini.
- **Durum çiftleri**: hata (`bad-*`) ve bilgi (`info-fg`) de bg/line/fg çifti olarak gelir; CSS'te `--bad-*`, `--info-*`, `--good-*`.

### Named Rules
**The One Blue Rule.** Mavi eylemin tek rengidir (düğme, bağlantı, seçili, odak). İlerleme için mavi kullanılmaz; o iş naneye aittir.
**The Role Tone Rule.** Nane ilerleme/tamamlanma, mercan ders ayrıntısı, sarı takvim demektir; her ton yalnız kendi rolünde ve nokta, çubuk, rozet, ikon kutusu ölçeğinde kalır, büyük dolgu yüzey olmaz.
**The Token-Name Rule.** Bileşen ham hex yazmaz, `var(--brand)`, `var(--mint)`, `var(--line)` gibi rol jetonunu okur; tema yalnız jeton bloğunda değişir.
**The Paired Status Rule.** Durum ve rol renkleri arka plan ve metin çifti olarak gelir; açık ve koyuda ayrı ayarlıdır.

## Typography

**Display Font:** Manrope (next/font/google, latin + latin-ext, `font-display: swap`, değişken `--font-manrope`; yedek ui-sans-serif, system-ui)
**Body Font:** Segoe UI (yedek Arial, sans-serif)

**Character:** Tek aile (Manrope) her yerde konuşur; hiyerarşi ağırlık ve boyutla kurulur.

### Hierarchy
- **Display** (600, `clamp(2.3rem, 6.4vw, 4.9rem)`, 1.08, -0.03em): landing H1; iki satır, ikinci satır `--brand` renginde.
- **Headline** (600, `clamp(1.8rem, 3.8vw, 2.8rem)`, 1.12): landing özellik başlığı (kapanış `clamp(1.9rem, 4.6vw, 3.2rem)`).
- **Title** (600, 1.12rem, -0.01em): adım başlıkları.
- **Body** (400, 1rem, 1.6; lead `clamp(1.05rem, 1.9vw, 1.3rem)`): ikincil renk, `max-width: 30em` lead, `text-wrap: balance/pretty`.
- **App heading** (650, 2.2rem, -1.2px; h2 1.2rem): giriş sonrası sayfa başlıkları, sistem yazı tipinde.
- **Label** (600, ~0.85rem): düğme, tablo başlığı (0.73rem), menü satırı (0.88rem).

### Named Rules
**The One Voice Rule.** Tüm sitede yalnız Manrope (ve sistem yedekleri); ikinci bir aile eklenmez.
**The Tabular Rule.** Saat, tarih ve sayı sütunları `font-variant-numeric: tabular-nums` kullanır.

## Layout

Landing: en çok 1240px içerik kabı, yan boşluk `clamp(20px, 5vw, 56px)`. Üst çubuk yapışkan, 68px, üç sütun (logo, orta gezinme, sağ eylemler). Hero ortalı; altında en çok 1250px çerçeveli ürün paneli (232px kenar çubuğu + `1.25fr / 1fr` ana ızgara), onun altında üç sütunlu adım sırası (01 / 02 / 03), ardından iki sütunlu özellik listesi ve kapanış. Bölüm araları büyük ve esnek (`clamp(80px, 12vw, 150px)`).

Uygulama: kenar çubuğu + üst çubuk (78px) + `max-width: 1400px` çalışma alanı, iç boşluk 40px 42px. Kartlar arası boşluk 20 ile 25px. Kırılmalar 1100, 900, 767 (alt gezinme çubuğu, tam ekran pencereler), 650 ve 600px; landing'de 900 ve 720px: önizlemede kenar çubuğu gizlenir, sütunlar tek sütuna iner.

## Elevation & Depth

Çoğunlukla tonlu katman: zemin, yüzey, iç panel sırası ve 1px çizgi derinliği taşır. Gölge yalnız çerçeveli landing önizlemesinde, giriş kartında ve landing dolu düğmesinde; kart ve menüde gölge yok. Seçili/bugün durumu gölge değil 1px renkli halkayla (`box-shadow: 0 0 0 1px`) işaretlenir.

### Shadow Vocabulary
- **Önizleme çerçevesi** (`box-shadow: 0 2px 6px rgba(0,0,0,.08), 0 40px 70px -40px rgba(0,0,0,.45)`): landing ürün paneli.
- **Dolu düğme** (`box-shadow: 0 1px 2px rgba(0,0,0,.18), 0 10px 20px -12px rgba(0,0,0,.5)`): landing `solid` düğmesi.
- **Giriş kartı** (`0 30px 80px -40px rgba(0,0,0,.8)`): auth kartı.

### Named Rules
**The Tonal Layer Rule.** Derinlik önce zemin/yüzey/iç panel sırasıyla ve çizgiyle kurulur; gölge yalnız çerçeve ve ana eylemde, hep yumuşak ve negatif yayılımlı.

## Shapes

Yumuşak ama keskin kenarlı geometri: küçük öğeler 6 ile 8px, düğme ve satır 8 ile 10px, kart 12 ile 14px, büyük çerçeve 16 ile 18px; yuvarlak yalnız avatar, nokta, onay ve hap etiketlerde. Her yüzeyde 1px çizgi; boş alan ve yükleme alanı kesikli (1.5px dashed) kenar alır. Logo: defter gövdesi, spiral delikleri, içinde N harfi ve kalem ucu; `currentColor` ile iki temaya uyar.

## Components

### Buttons
- **Shape:** 10px köşe (landing), 9px (uygulama `.primary`), 8px (ikincil).
- **Primary:** `--brand` dolgu, `--on-brand` metin, 600 ağırlık; landing 11px 22px, büyük 16px 30px. Hover `--brand-hover`, 1px yukarı kayma (landing).
- **Secondary:** yüzey dolgulu, 1px çizgi, metin `--fg`; hover iç panel tonu.
- **Text:** `--brand` renkte, hover altı çizili; ok işaretli ikincil eylem.
- **Focus:** 2px `--brand` halka, 3px uzaklık.

### Cards / Containers
- **Corner Style:** 12 ile 14px; büyük çerçeve 18px.
- **Background:** `--surface`, iç alanlar `--inner`; **Border:** 1px `--line`; **Padding:** 14 ile 25px. Gölge yok (bkz. Elevation).

### Inputs / Fields
- İç panel zemin (`--inner`), 1px `--line2` kenar, 7 ile 8px köşe, min yükseklik 43px; odak 2px `--brand` dış çizgi. Mobilde 16px yazı (yakınlaştırma önleme).

### Navigation
- Landing üst çubuğu: wordmark solda, "Özellikler" ve "Nasıl çalışır?" ortada, metin bağlantı "Üye girişi" ve dolu "Kayıt ol" sağda; 720px altında orta gezinme gizlenir.
- Uygulama kenar çubuğu: yüzey zemin, satır 10px köşe; aktif satır `--sel` zemin, 600 ağırlık, ikon `--brand`; hover `--brand-soft`. Mobilde alt çubuk, ortada yuvarlak ana eylem düğmesi.

### Ürün önizleme paneli (imza bileşen)
Landing'in kanıtı: kenar çubuğu, bugünün programı (saat, nokta, nane ilerleme çubuğu, nane onay dairesi), net çizgi grafiği (çizgi `--brand`, alan dolgusu %18) ve yaklaşan deneme kartı (sarı tarih kutusu). Ders satırı noktası mavi, mercan veya nane tonunda olabilir; çubuk ve onay her zaman nane. Veri örnektir ve "Örnek ekran; gösterilen veriler örnektir." notuyla etiketlenir.

## Do's and Don'ts

### Do:
- **Do** rengi rol jetonundan oku (`--brand`, `--mint`, `--coral`, `--sun`, `--surface`, `--line`, `--fg2`); yeni tema değeri yalnız "Tema jetonları" bloğuna girer.
- **Do** koyu temada düğme ve işaret metni için `--on-brand` kullan.
- **Do** ilerleme çubuğu ve tamamlanma işaretini nane, ders ayrıntısını mercan, takvim vurgusunu sarı ver; eylemi mavi bırak.
- **Do** rol tonlarını nokta, çubuk, rozet ve ikon kutusu ölçeğinde tut; metin tonlarını `-fg`/`-bg` çifti olarak ver.
- **Do** başlıkta Manrope 700, -0.02em; gövdede aynı aile.
- **Do** tüm animasyonu `prefers-reduced-motion` altında kapatılabilir tut.

### Don't:
- **Don't** ilerleme veya tamamlanma için mavi, eylem için nane/mercan/sarı kullan.
- **Don't** rol tonlarını büyük dolgu yüzeye taşı; mavi eylem baskın kalır.
- **Don't** kartlara gölge koy; derinlik tonlu katmandan gelir.
- **Don't** arayüzde emoji kullan; ikon SVG'dir.
- **Don't** yeni bileşende ham hex yaz; mevcut sabit hex'leri örnek alma.
