# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Mevcut kod tabanı: Next.js (vinext/Vite) + React 19, Tailwind 4, shadcn/ui, Cloudflare Workers. Yığın değişmez.

## Users

YKS'ye hazırlanan lise öğrencileri ve mezunlar (Türkiye). Telefonda ve bilgisayarda, ders çalışırken ya da deneme sonrası defterini açarlar. Görevleri: haftalık ders programını takip etmek, yanlış yaptıkları soruları biriktirip konu konu tekrar etmek, deneme netlerinin gelişimini izlemek.

## Product Purpose

netudu (kod adı Net Defterim), YKS hazırlığını tek yerde toplar: kişisel çalışma programı, fotoğraftan yanlış defteri (yapay zekâ çözümü, MEB Maarif konu eşlemesi, konu videosu, aralıklı tekrar), ders notları, aylık rapor ve deneme/net takibi. Başarı: öğrenci her gün ne yapacağını bilir, yanlışlarından öğrenir ve gelişimini görür.

## Positioning

Program, yanlış defteri ve deneme takvimi ayrı araçlarda değil tek hesapta; her şey öğrencinin kendi okul/dershane/spor düzenine ve YKS konu listesine göre kurulur.

## Operating Context

Her kullanıcı kendi hesabını açar; defter yalnızca sahibine görünür. Giriş e-posta+şifre ya da Google ile. Giriş yapılmamışken kullanıcı doğrudan giriş ekranını görüyor; yeni tasarımla önce bir tanıtım (landing) sayfası görecek.

## Capabilities and Constraints

- Bugün / Haftalık program, Yanlış arşivi, Aylık rapor, Denemelerim, Ders notlarım, Ayarlar.
- Giriş mantığı (AuthScreen, /api/auth/*) değişmez; landing'in "Üye girişi" ve "Kayıt ol" düğmeleri mevcut giriş ekranını açar.
- Giriş sonrası uygulamanın yerleşimi ve davranışı korunur; yalnızca renk/tipografi dili yenilenir ve emojiler kaldırılır.
- Açık ve koyu tema: cihaz ayarına göre otomatik, Ayarlar'dan elle seçilebilir.

## Brand Commitments

- Ad: netudu (küçük harf). Logo: not defterini andıran "N" işareti + "netudu" yazısı; referans görsellerdeki biçimde SVG olarak çizilecek.
- Dil: Türkçe, sade ve doğrudan ("Tek hedef. Her şey yerli yerinde.", "Hedefine giden yol, tek bir yerde.").
- Görsel dünya kullanıcı tarafından iki referans görselle (açık/koyu landing, yerleşim için) ve koyu lacivert palet değerleriyle (renk için) sabitlendi; arayüzde emoji kullanılmaz. Logo kullanıcının verdiği SVG; başlık ve yazı logosu Poppins SemiBold.

## Evidence on Hand

- Referans görseller: açık ve koyu landing ekranı (oturum görselleri).
- Koyu palet (kullanıcının son kararı, ilk yeşil paletin yerine geçti): #101722 gece laciverti zemin, #192333 yüzey, #223047 iç panel, #354761 kenarlık, #F5F7FC metin, #B8C5D8 ikincil metin, #38B6FF gök mavisi (ana vurgu ve düğmeler), #FF875C mercan (ders ayrıntıları), #35D6A0 nane (ilerleme ve tamamlanma), #FFC857 güneş sarısı (takvim vurgusu), #101722 renkli düğme metni. Açık tema karşılığı bu mavi aileden türetilmiştir (marka #0B74C9, zemin #F5F8FC).
- Gerçek müşteri, yorum, kullanıcı sayısı ya da benchmark yok; landing'de uydurulmayacak. Landing'deki ürün önizlemesi örnek veridir ve sentetik olarak etiketlenir.

## Product Principles

1. Önce bugünün işi: öğrenci ne yapacağını ilk bakışta görür.
2. Yanlış bir kayıp değil, bir sonraki doğrunun malzemesidir.
3. Sakin, güven veren, gösterişsiz arayüz; süs yerine okunabilirlik.
4. Uydurma iddia yok: yalnızca ürünün gerçekten yaptığı şeyler anlatılır.

## Accessibility & Inclusion

Açık ve koyu temada okunur kontrast; klavye ile kullanılabilirlik; azaltılmış hareket tercihine saygı.
