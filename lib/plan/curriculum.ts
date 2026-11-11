// TYT çalışma sırası: 16 hafta × 7 gün = 112 birim, 3 çalışma temposu.
// Not: ders adları lib/meb-topics.ts'teki Maarif ders adlarıyla eşlenir (noteSubject); birimlerin konu başlıkları bu dosyanın kendi içeriğidir.
// Kaynak: github.com/keremisthebabo/tyt (js/curriculum.js), Net Defterim'e TypeScript olarak taşındı; arayüz renk sınıfları çıkarıldı.
export const ALL_DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'] as const;
export type DayKey = typeof ALL_DAYS[number];

export const DAY_FULL_NAMES: Record<DayKey, string> = {
  Pzt: 'Pazartesi',
  Sal: 'Salı',
  Çar: 'Çarşamba',
  Per: 'Perşembe',
  Cum: 'Cuma',
  Cmt: 'Cumartesi',
  Paz: 'Pazar'
};

export const DIRECT_CHANNELS: Record<string, string> = {
  mertHoca: "https://www.youtube.com/@MertHoca",
  eyupB: "https://www.youtube.com/@eyupbmatematikgeometri",
  rustuHoca: "https://www.youtube.com/@rustuhocaileturkce",
  vipFizik: "https://www.youtube.com/@vipfizik",
  gorkemSahin: "https://www.youtube.com/@BenimHocamOrtaokul",
  kenanKara: "https://www.youtube.com/@KenanKaraileGeometri",
  drBiyoloji: "https://www.youtube.com/@BARIŞHOCABİYOLOJİ"
};

export const MACRO_PHASES = [
  { id: 1, name: "Aşama 1: Temel İnşa & Sayılar / Anlam Bilgisi", weeks: [1, 2, 3, 4] },
  { id: 2, name: "Aşama 2: Denklem, Fonksiyon & Dil Bilgisi", weeks: [5, 6, 7, 8] },
  { id: 3, name: "Aşama 3: Problemler, Üçgenler & Fen İskeleti", weeks: [9, 10, 11, 12] },
  { id: 4, name: "Aşama 4: PKOB, İleri Geometri, Sosyal & Denemeler", weeks: [13, 14, 15, 16] }
];
export type TempoKey = 'relaxed' | 'balanced' | 'intense';
export type Tempo = { id: TempoKey; name: string; badge: string; totalWeeks: number; dailyHoursLabel: string; exampleLabel: string; desc: string; studyBlocks: { durationMin: number; label: string; tag: string }[] };
export const TEMPO_OPTIONS: Record<TempoKey, Tempo> = {
  relaxed: {
    id: 'relaxed',
    name: 'Rahat program',
    badge: 'Rahat · 22 hafta',
    totalWeeks: 22,
    dailyHoursLabel: 'Günde yaklaşık 1,5–2 saat',
    exampleLabel: '30 soru, konu tekrarı, 15 paragraf',
    desc: '22 haftaya yayılır; günlük yük hafiftir, konuları sindirerek ilerlersin.',
    studyBlocks: [
      { durationMin: 95, label: 'Konu videosu + 30 soru + 15 paragraf', tag: 'TYT Rahat Blok' }
    ]
  },
  balanced: {
    id: 'balanced',
    name: 'Dengeli program',
    badge: 'Dengeli · 16 hafta',
    totalWeeks: 16,
    dailyHoursLabel: 'Günde yaklaşık 3 saat',
    exampleLabel: '50 soru, konu tekrarı, 20 paragraf',
    desc: 'Standart 16 haftalık tempo; okul ve sabit derslerinle dengeli ilerler.',
    studyBlocks: [
      { durationMin: 95, label: 'Konu anlatımı + 35 soru', tag: 'TYT Ana Blok' },
      { durationMin: 75, label: '20 Paragraf Rutini + 15 Soru Konu Tekrarı & Analiz', tag: 'TYT Pekiştirme' }
    ]
  },
  intense: {
    id: 'intense',
    name: 'Yoğun program',
    badge: 'Yoğun · 12 hafta',
    totalWeeks: 12,
    dailyHoursLabel: 'Günde 4,5 saat ve üzeri',
    exampleLabel: '90 soru, 2 konu, branş denemesi',
    desc: '12 haftada biter; okul ve sabit derslerinden kalan boş saatler çalışmaya ayrılır.',
    studyBlocks: [
      { durationMin: 95, label: '1. konu videosu + 45 soru', tag: 'TYT Yoğun Blok 1' },
      { durationMin: 95, label: '2. konu ve ileri düzey soru + 45 soru', tag: 'TYT Yoğun Blok 2' },
      { durationMin: 75, label: '25 Paragraf + Süreli Branş Taraması & Yanlış Analizi', tag: 'TYT Yoğun Blok 3' }
    ]
  }
};

export type CurriculumDay = { day: string; subj: string; topic: string; teacher: string; target: string; directUrl: string; channelUrl: string; note: string };
export const WEEKS_DATABASE: { weekNum: number; phaseId: number; title: string; desc: string; days: CurriculumDay[] }[] = [
  {
    weekNum: 1, phaseId: 1,
    title: "1. Hafta: Temel Kavramlar & Anlam Bilgisi",
    desc: "Sayı kümelerini kavrama, okuduğunu anlama hızını artırma ve temel fen kavramlarını zihinde somutlaştırma.",
    days: [
      { day: "Pazartesi", subj: "TYT Matematik", topic: "Temel Kavramlar & Sayı Kümeleri", teacher: "Mert Hoca", target: "20 Paragraf + 35 Mat Sorusu", directUrl: "https://www.youtube.com/watch?v=8F-ojRKYTVU", channelUrl: DIRECT_CHANNELS.mertHoca, note: "Rakam, doğal sayı, tam sayı kümeleri ve basamak çözümleme modellemesi." },
      { day: "Salı", subj: "TYT Türkçe", topic: "Sözcükte ve Cümlede Anlam", teacher: "Rüştü Hoca", target: "35 Paragraf Sorusu", directUrl: "https://www.youtube.com/watch?v=04toVLmAjBk", channelUrl: DIRECT_CHANNELS.rustuHoca, note: "Kelime bağlamı ve cümlede örtük anlam çıkarma taktikleri." },
      { day: "Çarşamba", subj: "TYT Matematik", topic: "Bölme - Bölünebilme Kuralları", teacher: "Eyüp B.", target: "20 Paragraf + 35 Mat Sorusu", directUrl: "https://www.youtube.com/watch?v=I7uZd3rf-1U", channelUrl: DIRECT_CHANNELS.eyupB, note: "Kalan bulma mantığı ve periyodik durumlar VDD analizi." },
      { day: "Perşembe", subj: "TYT Fizik & Deneme", topic: "Fizik Bilimine Giriş & Madde-Özellik", teacher: "VIP Fizik", target: "Haftalık Deneme Analizi + 20 Paragraf", directUrl: "https://www.youtube.com/watch?v=JiMbXX0a3eg", channelUrl: DIRECT_CHANNELS.vipFizik, note: "Temel ve türetilmiş büyüklükler, adezyon-kohezyon modelleri." },
      { day: "Cuma", subj: "TYT Türkçe", topic: "Sözcük Türleri 1: İsimler & Sıfatlar", teacher: "Aker Kartal", target: "30 Dil Bilgisi Sorusu", directUrl: "https://www.youtube.com/watch?v=cwPVMIgVvwQ", channelUrl: DIRECT_CHANNELS.rustuHoca, note: "Varlıkların nitelenmesi ve ad tamlamalarının metin analizi." },
      { day: "Cumartesi", subj: "TYT Geometri & Kimya", topic: "Doğruda Açılar + Kimya Bilimi", teacher: "Kenan Kara & Görkem Şahin", target: "25 Geo + 25 Kimya Sorusu", directUrl: "https://www.youtube.com/watch?v=VNh6--9IxEg", channelUrl: DIRECT_CHANNELS.kenanKara, note: "Z, U, M kuralı mantığı ve simyadan kimyaya dönüşüm." },
      { day: "Pazar", subj: "TYT Biyoloji & Tekrar", topic: "Canlıların Ortak Özellikleri & Haftalık Analiz", teacher: "Dr. Biyoloji", target: "Haftalık Yanlış Analizi + 25 Biyoloji", directUrl: "https://www.youtube.com/watch?v=JqVImq7hFjk", channelUrl: DIRECT_CHANNELS.drBiyoloji, note: "Hücresel yapı, metabolizma ve homeostazi kavram haritası." }
    ]
  },
  {
    weekNum: 2, phaseId: 1,
    title: "2. Hafta: Asal Sayılar, Rasyonel Sayılar & Paragraf Yapısı",
    desc: "Kesir modellemeleri, asal çarpanlara ayırma ve metin yapılandırma teknikleri.",
    days: [
      { day: "Pazartesi", subj: "TYT Matematik", topic: "Asal Çarpanlar & EBOB - EKOK", teacher: "Mert Hoca", target: "20 Paragraf + 35 Mat Sorusu", directUrl: "https://www.youtube.com/watch?v=sPZus-twlX0", channelUrl: DIRECT_CHANNELS.mertHoca, note: "Parçadan bütüne ve bütünden parçaya problem senaryoları." },
      { day: "Salı", subj: "TYT Türkçe", topic: "Paragrafta Yapı & Akışı Bozan Cümleler", teacher: "Rüştü Hoca", target: "35 Paragraf Sorusu", directUrl: "https://www.youtube.com/watch?v=hvMm5iSHD1U", channelUrl: DIRECT_CHANNELS.rustuHoca, note: "Düşünce zincirini koparan ifadeleri tespit etme teknikleri." },
      { day: "Çarşamba", subj: "TYT Matematik", topic: "Rasyonel ve Ondalık Sayılar", teacher: "Eyüp B.", target: "20 Paragraf + 35 Mat Sorusu", directUrl: "https://www.youtube.com/watch?v=n6qulC7DFEA", channelUrl: DIRECT_CHANNELS.eyupB, note: "Sayı doğrusunda kesir konumlandırma ve devirli ondalıklar." },
      { day: "Perşembe", subj: "TYT Fizik & Deneme", topic: "Katı, Sıvı ve Gazlarda Basınç", teacher: "VIP Fizik", target: "Deneme Analizi + 20 Fizik", directUrl: "https://www.youtube.com/watch?v=iYD2jOLFv9A", channelUrl: DIRECT_CHANNELS.vipFizik, note: "P=F/S modellemesi ve Pascal prensibi günlük hayat örnekleri." },
      { day: "Cuma", subj: "TYT Türkçe", topic: "Sözcük Türleri 2: Zamirler & Zarflar", teacher: "Aker Kartal", target: "30 Dil Bilgisi Sorusu", directUrl: "https://www.youtube.com/watch?v=EXiiTMOGmE4", channelUrl: DIRECT_CHANNELS.rustuHoca, note: "Fiili niteleyen durum, zaman ve miktar ilişkileri." },
      { day: "Cumartesi", subj: "TYT Geometri & Kimya", topic: "Üçgende Açılar + Atom ve Periyodik Sistem", teacher: "Kenan Kara & Görkem Şahin", target: "25 Geo + 25 Kimya Sorusu", directUrl: "https://www.youtube.com/watch?v=Gkd7FN0cYoY", channelUrl: DIRECT_CHANNELS.gorkemSahin, note: "İç açılar toplamı ispatı ve periyodik özelliklerin değişimi." },
      { day: "Pazar", subj: "TYT Biyoloji & Tekrar", topic: "İnorganik ve Organik Bileşikler", teacher: "Dr. Biyoloji", target: "Haftalık Yanlış Analizi + 30 Biyoloji", directUrl: "https://www.youtube.com/watch?v=MgsF9_Yi6es", channelUrl: DIRECT_CHANNELS.drBiyoloji, note: "Monomer-polimer yapısı ve bağ türleri haritası." }
    ]
  },
  {
    weekNum: 3, phaseId: 1,
    title: "3. Hafta: Eşitsizlik, Mutlak Değer & Sıvıların Kaldırma Kuvveti",
    desc: "Sayı doğrusunda aralık mantığı, mutlak uzaklık ve Arşimet prensibi.",
    days: [
      { day: "Pazartesi", subj: "TYT Matematik", topic: "Birinci Dereceden Basit Eşitsizlikler", teacher: "Mert Hoca", target: "20 Paragraf + 35 Mat Sorusu", directUrl: "https://www.youtube.com/watch?v=dHYAFxvNNsA", channelUrl: DIRECT_CHANNELS.mertHoca, note: "Aralık kavramı ve eşitsizliklerde işaret yönü değiştirme kuralları." },
      { day: "Salı", subj: "TYT Türkçe", topic: "Paragrafta Ana Düşünce & Yardımcı Fikirler", teacher: "Rüştü Hoca", target: "35 Paragraf Sorusu", directUrl: "https://www.youtube.com/watch?v=ZffDBtDhouk", channelUrl: DIRECT_CHANNELS.rustuHoca, note: "Yazarın vermek istediği temel mesajı süzme taktikleri." },
      { day: "Çarşamba", subj: "TYT Matematik", topic: "Mutlak Değer Modellemesi & Geometrik Yorum", teacher: "Eyüp B.", target: "20 Paragraf + 35 Mat Sorusu", directUrl: "https://www.youtube.com/watch?v=28hQk0V0AZA", channelUrl: DIRECT_CHANNELS.eyupB, note: "|x-a| ifadesini sayı doğrusunda uzaklık olarak modelleme." },
      { day: "Perşembe", subj: "TYT Fizik & Deneme", topic: "Kaldırma Kuvveti & Yüzme Şartları", teacher: "VIP Fizik", target: "Deneme Analizi + 20 Paragraf", directUrl: "https://www.youtube.com/watch?v=kxL5hmiKJMI", channelUrl: DIRECT_CHANNELS.vipFizik, note: "Batan hacim, yoğunluk ilişkisi ve taşırma kapları mantığı." },
      { day: "Cuma", subj: "TYT Türkçe", topic: "Edat, Bağlaç, Ünlem & Fiiller (Anlam/Kip)", teacher: "Aker Kartal", target: "30 Dil Bilgisi Sorusu", directUrl: "https://www.youtube.com/watch?v=zCtX9b7WcSM", channelUrl: DIRECT_CHANNELS.rustuHoca, note: "Söz öbekleri arasındaki anlamsal bağlar ve kip kayması." },
      { day: "Cumartesi", subj: "TYT Geometri & Kimya", topic: "Özel Üçgenler (30-60-90, İkizkenar) + Kimyasal Türler", teacher: "Kenan Kara & Görkem Şahin", target: "25 Geo + 25 Kimya Sorusu", directUrl: "https://www.youtube.com/watch?v=4HFJVwEkaWM", channelUrl: DIRECT_CHANNELS.kenanKara, note: "Pisagor bağıntısı ve iyonik-kovalent bağ modellemeleri." },
      { day: "Pazar", subj: "TYT Biyoloji & Tekrar", topic: "Enzimler, Vitaminler ve Nükleik Asitler", teacher: "Dr. Biyoloji", target: "Yanlış Defteri Tekrarı + 25 Biyoloji", directUrl: "https://www.youtube.com/watch?v=56fiFbIYsS0", channelUrl: DIRECT_CHANNELS.drBiyoloji, note: "Aktivasyon enerjisi grafikleri ve ATP sentez mekanizması." }
    ]
  },
  {
    weekNum: 4, phaseId: 1,
    title: "4. Hafta: Üslü - Köklü Sayılar & Aşama 1 Değerlendirmesi",
    desc: "Kuvvet ve kök kavramı, hücre yapısı ve 1. Aşama toparlama taraması.",
    days: [
      { day: "Pazartesi", subj: "TYT Matematik", topic: "Üslü İfadeler ve Özellikleri", teacher: "Mert Hoca", target: "20 Paragraf + 35 Mat Sorusu", directUrl: "https://www.youtube.com/watch?v=bj2GmlIqirM", channelUrl: DIRECT_CHANNELS.mertHoca, note: "Üstel büyüme, basamak sayısı bulma ve bilimsel gösterim." },
      { day: "Salı", subj: "TYT Türkçe", topic: "Anlatım Teknikleri & Düşünceyi Geliştirme Yolları", teacher: "Rüştü Hoca", target: "35 Paragraf Sorusu", directUrl: "https://www.youtube.com/watch?v=XOl2bYPpb30", channelUrl: DIRECT_CHANNELS.rustuHoca, note: "Tanımlama, örneklendirme, tanık gösterme ve karşılaştırma." },
      { day: "Çarşamba", subj: "TYT Matematik", topic: "Köklü İfadeler ve Eşlenik", teacher: "Eyüp B.", target: "20 Paragraf + 35 Mat Sorusu", directUrl: "https://www.youtube.com/watch?v=HWQSINaPok8", channelUrl: DIRECT_CHANNELS.eyupB, note: "Kök dışına çıkarma ve paydada köklü ifade bırakmama mantığı." },
      { day: "Perşembe", subj: "TYT Fizik & Deneme", topic: "Isı, Sıcaklık ve İç Enerji", teacher: "VIP Fizik", target: "Deneme Analizi + 20 Fizik", directUrl: "https://www.youtube.com/watch?v=y16L-k3zhzA", channelUrl: DIRECT_CHANNELS.vipFizik, note: "Hal değişimi grafikleri, genleşme ve ısı iletim yolları." },
      { day: "Cuma", subj: "TYT Türkçe", topic: "Ek Fiil ve Fiilde Çatı Mantığı", teacher: "Aker Kartal", target: "30 Dil Bilgisi Sorusu", directUrl: "https://www.youtube.com/watch?v=nHs5720AusQ", channelUrl: DIRECT_CHANNELS.rustuHoca, note: "Özne-nesne ilişkisi (etken, edilgen, geçişli, geçişsiz)." },
      { day: "Cumartesi", subj: "TYT Geometri & Kimya", topic: "Eşkenar Üçgen + Maddenin Halleri", teacher: "Kenan Kara & Görkem Şahin", target: "25 Geo + 25 Kimya Sorusu", directUrl: "https://www.youtube.com/watch?v=kbk0x1g4Vqs", channelUrl: DIRECT_CHANNELS.gorkemSahin, note: "Yükseklik-açıortay çakışması ve gaz yasaları mantığı." },
      { day: "Pazar", subj: "Aşama 1 Taraması", topic: "Hücre Teorisi, Organeller & Genel Tarama", teacher: "Dr. Biyoloji", target: "1. Aşama Mini TYT Taraması + Analiz", directUrl: "https://www.youtube.com/watch?v=4wHBI6iwHno", channelUrl: DIRECT_CHANNELS.drBiyoloji, note: "Prokaryot-ökaryot farkı ve 1-4. haftanın genel pekiştirmesi." }
    ]
  },
  {
    weekNum: 5, phaseId: 2,
    title: "5. Hafta: Çarpanlara Ayırma, Oran - Orantı & Fiilimsiler",
    desc: "Cebirsel özdeşlikler, orantı çeşitleri ve cümlenin yapısal unsurları.",
    days: [
      { day: "Pazartesi", subj: "TYT Matematik", topic: "Çarpanlara Ayırma ve Özdeşlikler", teacher: "Mert Hoca", target: "20 Paragraf + 35 Mat Sorusu", directUrl: "https://www.youtube.com/watch?v=lvO7HeZXo3I", channelUrl: DIRECT_CHANNELS.mertHoca, note: "İki kare farkı, tam kare açılımı ve sadeleştirme modellemeleri." },
      { day: "Salı", subj: "TYT Türkçe", topic: "Fiilimsiler (İsim-fiil, Sıfat-fiil, Zarf-fiil)", teacher: "Rüştü Hoca", target: "30 Dil Bilgisi + 20 Paragraf", directUrl: "https://www.youtube.com/watch?v=otbZOLrlf_Q", channelUrl: DIRECT_CHANNELS.rustuHoca, note: "Ek-eylem ayrımı ve yan cümlecik kurma görevi analizi." },
      { day: "Çarşamba", subj: "TYT Matematik", topic: "Oran - Orantı ve Problem Temeli", teacher: "Eyüp B.", target: "20 Paragraf + 35 Mat Sorusu", directUrl: "https://www.youtube.com/watch?v=nm6Hs0idx5E", channelUrl: DIRECT_CHANNELS.eyupB, note: "Doğru ve ters orantı kurguları, bileşik orantı mantığı." },
      { day: "Perşembe", subj: "TYT Fizik & Deneme", topic: "Doğrusal Hareket (Hız, Sürat, İvme)", teacher: "VIP Fizik", target: "Deneme Analizi + 20 Fizik", directUrl: "https://www.youtube.com/watch?v=wBG2TWmP47c", channelUrl: DIRECT_CHANNELS.vipFizik, note: "Konum-zaman ve hız-zaman grafiklerinin eğimi ve alanı." },
      { day: "Cuma", subj: "TYT Türkçe", topic: "Sözcükte Yapı: Kökler ve Ekler (Çekim/Yapım)", teacher: "Aker Kartal", target: "35 Dil Bilgisi Sorusu", directUrl: "https://www.youtube.com/watch?v=63k9-DXYJCI", channelUrl: DIRECT_CHANNELS.rustuHoca, note: "Gövdeden türeme ve sözcüğün anlamsal kökünü bulma taktiği." },
      { day: "Cumartesi", subj: "TYT Geometri & Kimya", topic: "Üçgende Açıortay Bağıntıları + Karışımlar", teacher: "Kenan Kara & Görkem Şahin", target: "25 Geo + 25 Kimya Sorusu", directUrl: "https://www.youtube.com/watch?v=4rp-3YMXowc", channelUrl: DIRECT_CHANNELS.kenanKara, note: "İç açıortay kollar/tabanlar oranı ve kütlece yüzde derişim." },
      { day: "Pazar", subj: "TYT Biyoloji & Tekrar", topic: "Hücre Zarından Madde Geçişleri", teacher: "Dr. Biyoloji", target: "Haftalık Yanlış Analizi + 25 Biyoloji", directUrl: "https://www.youtube.com/watch?v=NYz4uNbiphU", channelUrl: DIRECT_CHANNELS.drBiyoloji, note: "Turgor, plazmoliz ve ATP harcanan geçiş modelleri." }
    ]
  },
  {
    weekNum: 6, phaseId: 2,
    title: "6. Hafta: Birinci Dereceden Denklemler & Cümle Ögeleri",
    desc: "Denklem kurma altyapısı, cümlenin ögeleri ve Newton yasaları.",
    days: [
      { day: "Pazartesi", subj: "TYT Matematik", topic: "Birinci Dereceden Denklemler", teacher: "Mert Hoca", target: "20 Paragraf + 35 Mat Sorusu", directUrl: "https://www.youtube.com/watch?v=DzPV2vxTmXM", channelUrl: DIRECT_CHANNELS.mertHoca, note: "Yok etme ve yerine koyma metoduyla denklem çözümü." },
      { day: "Salı", subj: "TYT Türkçe", topic: "Cümlenin Ögeleri (Yüklem, Özne, Nesne)", teacher: "Rüştü Hoca", target: "30 Dil Bilgisi + 20 Paragraf", directUrl: "https://www.youtube.com/watch?v=kOGjP-ZwsUQ", channelUrl: DIRECT_CHANNELS.rustuHoca, note: "Öbekleri parçalamadan temel ve yardımcı ögeleri bulma." },
      { day: "Çarşamba", subj: "TYT Matematik", topic: "Denklem Çözüm Kümeleri & Sonsuz/Boş Küme", teacher: "Eyüp B.", target: "20 Paragraf + 35 Mat Sorusu", directUrl: "https://www.youtube.com/watch?v=GtsHRuua07c", channelUrl: DIRECT_CHANNELS.eyupB, note: "Katsayı oranları ve analitik doğruların kesişim mantığı." },
      { day: "Perşembe", subj: "TYT Fizik & Deneme", topic: "Newton'ın Hareket Yasaları & Sürtünme", teacher: "VIP Fizik", target: "Deneme Analizi + 20 Fizik", directUrl: "https://www.youtube.com/watch?v=2oSC-L1b3H0", channelUrl: DIRECT_CHANNELS.vipFizik, note: "Eylemsizlik, F=m.a ve etki-tepki çifti çıkarımı." },
      { day: "Cuma", subj: "TYT Türkçe", topic: "Cümle Türleri (Yapı, Anlam ve Yükleme Göre)", teacher: "Aker Kartal", target: "30 Dil Bilgisi Sorusu", directUrl: "https://www.youtube.com/watch?v=lpoaJ8wcLr8", channelUrl: DIRECT_CHANNELS.rustuHoca, note: "Basit, birleşik, sıralı ve bağlı cümle çözümlemeleri." },
      { day: "Cumartesi", subj: "TYT Geometri & Kimya", topic: "Üçgende Kenarortay + Asitler ve Bazlar", teacher: "Kenan Kara & Görkem Şahin", target: "25 Geo + 25 Kimya Sorusu", directUrl: "https://www.youtube.com/watch?v=JJECPZ3Gd3M", channelUrl: DIRECT_CHANNELS.gorkemSahin, note: "Ağırlık merkezi kuralları ve nötralleşme tepkimeleri." },
      { day: "Pazar", subj: "TYT Biyoloji & Tekrar", topic: "Mitoz Bölünme & Eşeysiz Üreme", teacher: "Dr. Biyoloji", target: "Yanlış Defteri Tekrarı + 25 Biyoloji", directUrl: "https://www.youtube.com/watch?v=tSYRVXHb-c8", channelUrl: DIRECT_CHANNELS.drBiyoloji, note: "Kromozom sayısı grafikleri ve evrelerin şematik dizilimi." }
    ]
  },
  {
    weekNum: 7, phaseId: 2,
    title: "7. Hafta: Kümeler, Mantık & Yazım Kuralları",
    desc: "Küme problemleri, Venn şemaları, mantık bağlaçları ve yazım kuralları.",
    days: [
      { day: "Pazartesi", subj: "TYT Matematik", topic: "Kümelerde Temel İşlemler & Venn Şeması", teacher: "Mert Hoca", target: "20 Paragraf + 35 Mat Sorusu", directUrl: "https://www.youtube.com/watch?v=mngMZfQVtmA", channelUrl: DIRECT_CHANNELS.mertHoca, note: "Birleşim, kesişim, fark ve tümleme işlemleri." },
      { day: "Salı", subj: "TYT Türkçe", topic: "Yazım Kuralları (Büyük Harfler, Birleşik Kelimeler)", teacher: "Rüştü Hoca", target: "35 Dil Bilgisi Sorusu", directUrl: "https://www.youtube.com/watch?v=XIKi746J8HE", channelUrl: DIRECT_CHANNELS.rustuHoca, note: "TDK'nin güncel kuralları ve en çok karıştırılan kelimeler." },
      { day: "Çarşamba", subj: "TYT Matematik", topic: "Küme Problemleri & Sembolik Mantık", teacher: "Eyüp B.", target: "20 Paragraf + 35 Mat Sorusu", directUrl: "https://www.youtube.com/watch?v=YCaUgbjihDw", channelUrl: DIRECT_CHANNELS.eyupB, note: "Diller, sporlar ve kesişim formüllerinin modellemesi." },
      { day: "Perşembe", subj: "TYT Fizik & Deneme", topic: "İş, Güç ve Mekanik Enerji", teacher: "VIP Fizik", target: "Deneme Analizi + 20 Fizik", directUrl: "https://www.youtube.com/watch?v=_sJElq0_8lI", channelUrl: DIRECT_CHANNELS.vipFizik, note: "Kinetik-potansiyel enerji dönüşümleri ve sürtünme kaybı." },
      { day: "Cuma", subj: "TYT Türkçe", topic: "Yazım Kuralları 2: 'de', 'ki', 'mi' Yazımı", teacher: "Aker Kartal", target: "35 Dil Bilgisi Sorusu", directUrl: "https://www.youtube.com/watch?v=X--d21iqVcc", channelUrl: DIRECT_CHANNELS.rustuHoca, note: "Bağlaç olan ile ek olan eklerin kesin ayırt etme taktikleri." },
      { day: "Cumartesi", subj: "TYT Geometri & Kimya", topic: "Üçgende Benzerlik (Tales, Kelebek) + Tuzlar", teacher: "Kenan Kara & Görkem Şahin", target: "25 Geo + 25 Kimya Sorusu", directUrl: "https://www.youtube.com/watch?v=miqCN7ivZW8", channelUrl: DIRECT_CHANNELS.kenanKara, note: "Tales teoremi, kelebek kuralı ve yaygın tuzların özellikleri." },
      { day: "Pazar", subj: "TYT Biyoloji & Tekrar", topic: "Mayoz Bölünme & Eşeyli Üreme", teacher: "Dr. Biyoloji", target: "Yanlış Defteri Tekrarı + 25 Biyoloji", directUrl: "https://www.youtube.com/watch?v=Jw7IsZODmjI", channelUrl: DIRECT_CHANNELS.drBiyoloji, note: "Krossing-over, homolog kromozom ayrılması ve genetik çeşitlilik." }
    ]
  },
  {
    weekNum: 8, phaseId: 2,
    title: "8. Hafta: Fonksiyonlara Giriş, Noktalama & Aşama 2 Değerlendirmesi",
    desc: "Tanım-değer kümesi, fonksiyon grafikleri, noktalama işaretleri ve 2. Aşama taraması.",
    days: [
      { day: "Pazartesi", subj: "TYT Matematik", topic: "Fonksiyon Tanımı, Değer Bulma ve Türleri", teacher: "Mert Hoca", target: "20 Paragraf + 35 Mat Sorusu", directUrl: "https://www.youtube.com/watch?v=rUsrVJbScOs", channelUrl: DIRECT_CHANNELS.mertHoca, note: "Birebir, örten, sabit ve birim fonksiyon modelleri." },
      { day: "Salı", subj: "TYT Türkçe", topic: "Noktalama İşaretleri 1 (Nokta, Virgül)", teacher: "Rüştü Hoca", target: "35 Dil Bilgisi Sorusu", directUrl: "https://www.youtube.com/watch?v=iLu1zxORGL4", channelUrl: DIRECT_CHANNELS.rustuHoca, note: "Virgülün kullanıldığı ve asla kullanılamayacağı yerler." },
      { day: "Çarşamba", subj: "TYT Matematik", topic: "Fonksiyonlarda Bileşke & Ters Fonksiyon", teacher: "Eyüp B.", target: "20 Paragraf + 35 Mat Sorusu", directUrl: "https://www.youtube.com/watch?v=31704PYQm90", channelUrl: DIRECT_CHANNELS.eyupB, note: "(fog)(x) kuralı ve f^-1(x) cebirsel çıkarımı." },
      { day: "Perşembe", subj: "TYT Fizik & Deneme", topic: "Elektrostatik (Yükler, Elektroskop)", teacher: "VIP Fizik", target: "Deneme Analizi + 20 Fizik", directUrl: "https://www.youtube.com/watch?v=Uow-RmCi_8w", channelUrl: DIRECT_CHANNELS.vipFizik, note: "Sürtünme, dokunma ve etki ile elektriklenme modelleri." },
      { day: "Cuma", subj: "TYT Türkçe", topic: "Noktalama İşaretleri 2 (İki Nokta, Kesme)", teacher: "Aker Kartal", target: "35 Dil Bilgisi Sorusu", directUrl: "https://www.youtube.com/watch?v=CpCxBmpQdjM", channelUrl: DIRECT_CHANNELS.rustuHoca, note: "Özel adlara gelen eklerin ayrılması ve alıntı cümleler." },
      { day: "Cumartesi", subj: "TYT Geometri & Kimya", topic: "Üçgende Alan + Mol Hesaplamaları", teacher: "Kenan Kara & Görkem Şahin", target: "25 Geo + 25 Kimya Sorusu", directUrl: "https://www.youtube.com/watch?v=KzzpbC3AfK0", channelUrl: DIRECT_CHANNELS.gorkemSahin, note: "Taban x Yükseklik / 2 ve mol-kütle-hacim dönüşümleri." },
      { day: "Pazar", subj: "Aşama 2 Taraması", topic: "Kalıtım Temel İlkeleri (Mendel) + 2. Aşama Analizi", teacher: "Dr. Biyoloji", target: "2. Aşama Mini TYT Taraması + Analiz", directUrl: "https://www.youtube.com/watch?v=aK6e0Od3ppc", channelUrl: DIRECT_CHANNELS.drBiyoloji, note: "Monohibrit-dihibrit çaprazlama ve kan grupları analizi." }
    ]
  },
  {
    weekNum: 9, phaseId: 3,
    title: "9. Hafta: Problemler Kampı 1: Sayı & Kesir Problemleri",
    desc: "TYT'nin can damarı: Denklem kurma, kesir paydası eşitleme ve problem stratejileri.",
    days: [
      { day: "Pazartesi", subj: "TYT Matematik", topic: "Sayı Problemleri (Mum, Adım, Sıra, Tel)", teacher: "Mert Hoca", target: "20 Paragraf + 30 Sayı Problemi", directUrl: "https://www.youtube.com/watch?v=AEixrkLd6b8", channelUrl: DIRECT_CHANNELS.mertHoca, note: "Bilinmeyen seçerken paydaların EKOK'unu kullanma." },
      { day: "Salı", subj: "TYT Türkçe", topic: "Ses Bilgisi (Ünlü Düşmesi, Benzeşme)", teacher: "Rüştü Hoca", target: "30 Dil Bilgisi + 20 Paragraf", directUrl: "https://www.youtube.com/watch?v=5D9HMwJhRXk", channelUrl: DIRECT_CHANNELS.rustuHoca, note: "Kelime kökünden ek alırken gerçekleşen ses olayları analizi." },
      { day: "Çarşamba", subj: "TYT Matematik", topic: "Kesir Problemleri & Yeni Nesil Senaryolar", teacher: "Eyüp B.", target: "20 Paragraf + 30 Problem", directUrl: "https://www.youtube.com/watch?v=j7MI6-MUfdk", channelUrl: DIRECT_CHANNELS.eyupB, note: "Geriye kalanın kalanı kurguları ve kap modellemeleri." },
      { day: "Perşembe", subj: "TYT Fizik & Deneme", topic: "Elektrik Akımı, Dirençler & Ohm Yasası", teacher: "VIP Fizik", target: "Deneme Analizi + 20 Fizik", directUrl: "https://www.youtube.com/watch?v=IJhMCkQLkJg", channelUrl: DIRECT_CHANNELS.vipFizik, note: "Seri-paralel bağlama, V=I.R ve eşdeğer direnç bulma." },
      { day: "Cuma", subj: "TYT Matematik", topic: "Yaş Problemleri (Kişiler Arası Sabit Fark)", teacher: "Mert Hoca", target: "20 Paragraf + 25 Problem", directUrl: "https://www.youtube.com/watch?v=Ny4I-1pcmgY", channelUrl: DIRECT_CHANNELS.mertHoca, note: "Zaman geçtikçe yaş farkının asla değişmeyeceği mantığı." },
      { day: "Cumartesi", subj: "TYT Geometri & Kimya", topic: "Açı - Kenar Bağıntıları + Tepkime Türleri", teacher: "Kenan Kara & Görkem Şahin", target: "25 Geo + 25 Kimya Sorusu", directUrl: "https://www.youtube.com/watch?v=j6npfsGYv5Y", channelUrl: DIRECT_CHANNELS.kenanKara, note: "Büyük açı karşısında büyük kenar kuralı ve çökelme tepkimeleri." },
      { day: "Pazar", subj: "TYT Biyoloji & Tekrar", topic: "Ekolojiye Giriş (Ekosistem ve Besin Zinciri)", teacher: "Dr. Biyoloji", target: "Yanlış Defteri Tekrarı + 25 Biyoloji", directUrl: "https://www.youtube.com/watch?v=iCjhMz5PL-s", channelUrl: DIRECT_CHANNELS.drBiyoloji, note: "Besin zinciri, trofik düzeyler ve biyolojik birikim." }
    ]
  },
  {
    weekNum: 10, phaseId: 3,
    title: "10. Hafta: Problemler Kampı 2: Yüzde, Kâr-Zarar & Karışım",
    desc: "Yüzde hesabı, maliyet-satış ilişkisi ve kap karışım problemleri.",
    days: [
      { day: "Pazartesi", subj: "TYT Matematik", topic: "Yüzde ve İskonto Problemleri", teacher: "Mert Hoca", target: "20 Paragraf + 30 Yüzde Problemi", directUrl: "https://www.youtube.com/watch?v=tC_hmX97EPw", channelUrl: DIRECT_CHANNELS.mertHoca, note: "Maliyeti 100x kabul etme yöntemi ve zam üstüne indirim." },
      { day: "Salı", subj: "TYT Türkçe", topic: "Anlatım Bozuklukları (Anlamsal ve Yapısal)", teacher: "Rüştü Hoca", target: "30 Dil Bilgisi + 20 Paragraf", directUrl: "https://www.youtube.com/watch?v=TV3TmsgZgtg", channelUrl: DIRECT_CHANNELS.rustuHoca, note: "Gereksiz sözcük kullanımı ve öge eksiklikleri." },
      { day: "Çarşamba", subj: "TYT Matematik", topic: "Kâr - Zarar & Enflasyon Problemleri", teacher: "Eyüp B.", target: "20 Paragraf + 30 Problem", directUrl: "https://www.youtube.com/watch?v=vnnJ3HSsV28", channelUrl: DIRECT_CHANNELS.eyupB, note: "Alış fiyatı, etiket fiyatı ve net kar marjı denklemleri." },
      { day: "Perşembe", subj: "TYT Fizik & Deneme", topic: "Elektriksel Güç, Enerji ve Lambalar", teacher: "VIP Fizik", target: "Deneme Analizi + 20 Fizik", directUrl: "https://www.youtube.com/watch?v=79siM_w1l7w", channelUrl: DIRECT_CHANNELS.vipFizik, note: "Lambaların parlaklığı (P=I^2.R ve P=V^2/R) analizi." },
      { day: "Cuma", subj: "TYT Matematik", topic: "Karışım Problemleri (Saf Madde Eşitliği)", teacher: "Mert Hoca", target: "20 Paragraf + 25 Karışım Sorusu", directUrl: "https://www.youtube.com/watch?v=YDcFBZRqTFQ", channelUrl: DIRECT_CHANNELS.mertHoca, note: "Madde miktarı x Yüzde = Toplam saf madde eşitliği." },
      { day: "Cumartesi", subj: "TYT Geometri & Kimya", topic: "Çokgenler & Düzgün Çokgenlerde Açılar", teacher: "Kenan Kara & Görkem Şahin", target: "25 Geo + 25 Kimya Sorusu", directUrl: "https://www.youtube.com/watch?v=Z1Eytt2jvXo", channelUrl: DIRECT_CHANNELS.gorkemSahin, note: "Dış açılar toplamı (360 derece) kuralı ve Kütlenin Korunumu kanunu." },
      { day: "Pazar", subj: "TYT Biyoloji & Tekrar", topic: "Madde Döngüleri (Karbon, Azot) ve Çevre", teacher: "Dr. Biyoloji", target: "Yanlış Defteri Tekrarı + 25 Biyoloji", directUrl: "https://www.youtube.com/watch?v=3JwISzJMV9Q", channelUrl: DIRECT_CHANNELS.drBiyoloji, note: "Azot fiksasyonu, nitrifikasyon ve denitrifikasyon bakterileri." }
    ]
  },
  {
    weekNum: 11, phaseId: 3,
    title: "11. Hafta: Problemler Kampı 3: Hız - Hareket & İşçi Problemleri",
    desc: "x = v.t formülü, zıt/aynı yönlü hareket, tren-tünel ve dairesel pist modelleri.",
    days: [
      { day: "Pazartesi", subj: "TYT Matematik", topic: "Hız - Hareket Problemleri 1 (Doğrusal Pist)", teacher: "Mert Hoca", target: "20 Paragraf + 30 Hız Problemi", directUrl: "https://www.youtube.com/watch?v=0Atl6uSc90g", channelUrl: DIRECT_CHANNELS.mertHoca, note: "Zıt yönde hızlar toplamı, aynı yönde hızlar farkı." },
      { day: "Salı", subj: "TYT Türkçe", topic: "Paragrafta Çoklu Sorular (Metne Bağlı Sorular)", teacher: "Rüştü Hoca", target: "35 Paragraf Sorusu", directUrl: "https://www.youtube.com/watch?v=oh8uG7Bd1NQ", channelUrl: DIRECT_CHANNELS.rustuHoca, note: "Metni bir kere okuyup iki soruyu birden çözme zaman yönetimi." },
      { day: "Çarşamba", subj: "TYT Matematik", topic: "Hız Problemleri 2 (Tren-Tünel, Nehir)", teacher: "Eyüp B.", target: "20 Paragraf + 30 Problem", directUrl: "https://www.youtube.com/watch?v=BVzBODvrmj4", channelUrl: DIRECT_CHANNELS.eyupB, note: "Trenin kendi boyunu ekleme ve akıntı hızı etkileşimi." },
      { day: "Perşembe", subj: "TYT Fizik & Deneme", topic: "Mıknatıslar ve Manyetik Alan", teacher: "VIP Fizik", target: "Deneme Analizi + 20 Fizik", directUrl: "https://www.youtube.com/watch?v=KwAq-ASWGcI", channelUrl: DIRECT_CHANNELS.vipFizik, note: "Manyetik alan çizgileri, N-S kutup etkileşimi ve pusula sapması." },
      { day: "Cuma", subj: "TYT Matematik", topic: "İşçi Problemleri ve Birlikte Çalışma", teacher: "Mert Hoca", target: "20 Paragraf + 25 Problem", directUrl: "https://www.youtube.com/watch?v=HJNleId31GA", channelUrl: DIRECT_CHANNELS.mertHoca, note: "Birim zamanda yapılan iş üzerinden 1/t1 + 1/t2 = 1/T eşitliği." },
      { day: "Cumartesi", subj: "TYT Geometri & Kimya", topic: "Dörtgenler ve Yamukta Alan + Çevre Kimyası", teacher: "Kenan Kara & Görkem Şahin", target: "25 Geo + 25 Kimya Sorusu", directUrl: "https://www.youtube.com/watch?v=GcM6Ov5s6dM", channelUrl: DIRECT_CHANNELS.kenanKara, note: "Orta taban formülü, ikizkenar yamuk özellikleri ve sera gazları." },
      { day: "Pazar", subj: "TYT Biyoloji & Tekrar", topic: "Canlılar Dünyası ve Sınıflandırma", teacher: "Dr. Biyoloji", target: "Yanlış Defteri Tekrarı + 25 Biyoloji", directUrl: "https://www.youtube.com/watch?v=rit0LlD2Fnw", channelUrl: DIRECT_CHANNELS.drBiyoloji, note: "Türden aleme kategoriler ve ikili adlandırma (binomial)." }
    ]
  },
  {
    weekNum: 12, phaseId: 3,
    title: "12. Hafta: Grafik Problemleri, Mantık & Aşama 3 Değerlendirmesi",
    desc: "Daire, çizgi ve sütun grafiklerini cebirsel denkleme dökme, 3. Aşama taraması.",
    days: [
      { day: "Pazartesi", subj: "TYT Matematik", topic: "Tablo ve Grafik Problemleri (Daire/Sütun)", teacher: "Mert Hoca", target: "20 Paragraf + 30 Grafik Sorusu", directUrl: "https://www.youtube.com/watch?v=65pM6ofAgi8", channelUrl: DIRECT_CHANNELS.mertHoca, note: "360 derecelik daire dilimini yüzdeye veya sayıya oranlama." },
      { day: "Salı", subj: "TYT Türkçe", topic: "Paragraf Hız Denemesi & Karma Dil Bilgisi", teacher: "Rüştü Hoca", target: "40 Türkçe Karma Sorusu", directUrl: "https://www.youtube.com/watch?v=Fi0O4_z5y0U", channelUrl: DIRECT_CHANNELS.rustuHoca, note: "Süre tutarak 40 soruyu 45 dakikanın altında bitirme denemesi." },
      { day: "Çarşamba", subj: "TYT Matematik", topic: "Rutin Olmayan (Akıl Yürütme) Problemleri", teacher: "Eyüp B.", target: "20 Paragraf + 30 Problem", directUrl: "https://www.youtube.com/watch?v=3zj29m_9lrQ", channelUrl: DIRECT_CHANNELS.eyupB, note: "Şekilli, yönergeli ve Maarif modeli mantık soruları." },
      { day: "Perşembe", subj: "TYT Fizik & Deneme", topic: "Dalgalar 1: Yay ve Su Dalgaları", teacher: "VIP Fizik", target: "Deneme Analizi + 20 Fizik", directUrl: "https://www.youtube.com/watch?v=wva3mdDgnXc", channelUrl: DIRECT_CHANNELS.vipFizik, note: "Dalga boyu, frekans (v = λ.f) ve yansıma-kırılma kuralları." },
      { day: "Cuma", subj: "TYT Matematik", topic: "Mantık (Önermeler, Ve/Veya/İse Bağlaçları)", teacher: "Mert Hoca", target: "20 Paragraf + 25 Mantık Sorusu", directUrl: "https://www.youtube.com/watch?v=pdVMfd_lFUQ", channelUrl: DIRECT_CHANNELS.mertHoca, note: "Doğruluk değerleri ve koşullu önermenin karşıt-tersi." },
      { day: "Cumartesi", subj: "TYT Geometri & Kimya", topic: "Paralelkenar ve Eşkenar Dörtgen + Kimya Her Yerde", teacher: "Kenan Kara & Görkem Şahin", target: "25 Geo + 25 Kimya Sorusu", directUrl: "https://www.youtube.com/watch?v=wnjuhcFJENE", channelUrl: DIRECT_CHANNELS.gorkemSahin, note: "Karşılıklı kenar eşitliği, köşegen dikliği ve sabun/deterjan kimyası." },
      { day: "Pazar", subj: "Aşama 3 Taraması", topic: "Omurgalı / Omurgasız Hayvanlar + Problem Taraması", teacher: "Dr. Biyoloji", target: "3. Aşama Problem & Fen Taraması", directUrl: "https://www.youtube.com/watch?v=Rha8LKPg2to", channelUrl: DIRECT_CHANNELS.drBiyoloji, note: "Balık, kurbağa, sürüngen, kuş, memeli karşılaştırması." }
    ]
  },
  {
    weekNum: 13, phaseId: 4,
    title: "13. Hafta: Permütasyon, Kombinasyon, Olasılık & Tarih Başlangıcı",
    desc: "Sayma kuralları, seçim, sıralama, olasılık ve Tarih temel kavramları.",
    days: [
      { day: "Pazartesi", subj: "TYT Matematik", topic: "Sayma İlkeleri, Faktöriyel ve Permütasyon", teacher: "Mert Hoca", target: "20 Paragraf + 30 PKOB Sorusu", directUrl: "https://www.youtube.com/watch?v=JHMENIAC_X8", channelUrl: DIRECT_CHANNELS.mertHoca, note: "Toplama/çarpma yoluyla sayma ve nesneleri sıralama." },
      { day: "Salı", subj: "TYT Tarih & Türkçe", topic: "Tarih Bilimine Giriş, İlk Çağ Uygarlıkları", teacher: "Sosyal Kampı", target: "25 Tarih + 20 Paragraf", directUrl: "https://www.youtube.com/watch?v=veToYPwX0Zk", channelUrl: DIRECT_CHANNELS.rustuHoca, note: "Tarihin yöntemleri ve Mezopotamya/Anadolu uygarlıkları." },
      { day: "Çarşamba", subj: "TYT Matematik", topic: "Kombinasyon (Seçme Gruplama) ve Binom", teacher: "Eyüp B.", target: "20 Paragraf + 30 Soru", directUrl: "https://www.youtube.com/watch?v=LaHx8ZNnm4I", channelUrl: DIRECT_CHANNELS.eyupB, note: "n nesneden r tanesini seçme ve Pascal üçgeni katsayıları." },
      { day: "Perşembe", subj: "TYT Fizik & Deneme", topic: "Dalgalar 2: Ses ve Deprem Dalgaları", teacher: "VIP Fizik", target: "Deneme Analizi + 20 Fizik", directUrl: "https://www.youtube.com/watch?v=lRT38IbM7pw", channelUrl: DIRECT_CHANNELS.vipFizik, note: "Sesin yüksekliği (frekans), şiddeti (genlik) ve fay hatları." },
      { day: "Cuma", subj: "TYT Matematik", topic: "Olasılık (Basit ve Koşullu Olasılık)", teacher: "Mert Hoca", target: "20 Paragraf + 25 Olasılık Sorusu", directUrl: "https://www.youtube.com/watch?v=wWLodePjvUA", channelUrl: DIRECT_CHANNELS.mertHoca, note: "İstenen durum / Tüm durum oranı ve bağımsız olaylar." },
      { day: "Cumartesi", subj: "TYT Geometri & Coğrafya", topic: "Dikdörtgen ve Kare + Coğrafya: Harita Bilgisi", teacher: "Kenan Kara & Coğrafya", target: "25 Geo + 25 Coğrafya Sorusu", directUrl: "https://www.youtube.com/watch?v=P-swGwOf0jM", channelUrl: DIRECT_CHANNELS.kenanKara, note: "Köşegen dik kesişimleri ve harita ölçekleri / izohipsler." },
      { day: "Pazar", subj: "TYT Biyoloji & Felsefe", topic: "Genel Biyoloji Tekrarı + Felsefenin Alanı", teacher: "Dr. Biyoloji & Sosyal", target: "30 Biyoloji + 20 Felsefe Sorusu", directUrl: "https://www.youtube.com/watch?v=5kcLcw2-fFo", channelUrl: DIRECT_CHANNELS.drBiyoloji, note: "Bilgi felsefesi (Epistemoloji) ve varlık felsefesi akımları." }
    ]
  },
  {
    weekNum: 14, phaseId: 4,
    title: "14. Hafta: Veri - İstatistik, Optik 1 & Türk - İslam Tarihi",
    desc: "Merkezi eğilim ölçüleri (mod, medyan, ortalama), aydınlanma ve İslamiyet öncesi Türk tarihi.",
    days: [
      { day: "Pazartesi", subj: "TYT Matematik", topic: "İstatistik (Aritmetik Ortalama, Mod, Medyan)", teacher: "Mert Hoca", target: "20 Paragraf + 30 İstatistik", directUrl: "https://www.youtube.com/watch?v=ELesdGUHvBU", channelUrl: DIRECT_CHANNELS.mertHoca, note: "Grafik yorumlama ve standart sapma kavramsal mantığı." },
      { day: "Salı", subj: "TYT Tarih & Türkçe", topic: "İlk Türk Devletleri ve İslam Medeniyeti", teacher: "Sosyal Kampı", target: "25 Tarih + 20 Paragraf", directUrl: "https://www.youtube.com/watch?v=Lr9aHZ3oZHg", channelUrl: DIRECT_CHANNELS.rustuHoca, note: "Kut anlayışı, ikili teşkilat ve Dört Halife dönemi." },
      { day: "Çarşamba", subj: "TYT Matematik", topic: "Karma Problem ve Sayısal Mantık Denemesi", teacher: "Eyüp B.", target: "30 Seçme Problem Sorusu", directUrl: "https://www.youtube.com/watch?v=eisCK1Oej5M", channelUrl: DIRECT_CHANNELS.eyupB, note: "Zaman kısıtlaması altında karma problem çözüm stratejisi." },
      { day: "Perşembe", subj: "TYT Fizik & Deneme", topic: "Optik 1: Aydınlanma, Gölge ve Düzlem Ayna", teacher: "VIP Fizik", target: "Deneme Analizi + 20 Fizik", directUrl: "https://www.youtube.com/watch?v=XA-BrMet9lw", channelUrl: DIRECT_CHANNELS.vipFizik, note: "Işık akısı, aydınlanma şiddeti (E=I/d^2) ve tam/yarı gölge." },
      { day: "Cuma", subj: "TYT Felsefe & Din", topic: "Ahlak Felsefesi + Din Kültürü İnanç Esasları", teacher: "Sosyal Kampı", target: "25 Felsefe + 25 Din Sorusu", directUrl: "https://www.youtube.com/watch?v=90psHEJxloU", channelUrl: DIRECT_CHANNELS.rustuHoca, note: "İslam'da bilgi kaynakları ve ahlaki sorumluluk kavramları." },
      { day: "Cumartesi", subj: "TYT Geometri & Coğrafya", topic: "Deltoid, Çemberde Açılar + İklim Bilgisi", teacher: "Kenan Kara & Coğrafya", target: "25 Geo + 25 Coğrafya Sorusu", directUrl: "https://www.youtube.com/watch?v=KEQieweZcTU", channelUrl: DIRECT_CHANNELS.kenanKara, note: "Merkez ve çevre açı ilişkisi, sıcaklık-basınç-rüzgar haritaları." },
      { day: "Pazar", subj: "Branş Denemeleri", topic: "1x Türkçe Denemesi + 1x Matematik Denemesi", teacher: "Genel Analiz", target: "80 Deneme Sorusu + Detaylı Video Analizi", directUrl: "https://www.youtube.com/watch?v=D9Xc64j7py4", channelUrl: DIRECT_CHANNELS.eyupB, note: "Net sayısını ve yanlış yapılan konuların deftere yazılmasını takip et." }
    ]
  },
  {
    weekNum: 15, phaseId: 4,
    title: "15. Hafta: Optik 2, Katı Cisimler & Osmanlı / İnkılap Tarihi",
    desc: "Küresel aynalar, kırılma, prizmalar, prizma/piramit hacimleri ve Milli Mücadele.",
    days: [
      { day: "Pazartesi", subj: "TYT Matematik", topic: "TYT Matematik Son Tekrar: Kritik Noktalar", teacher: "Mert Hoca", target: "30 Karma Matematik Sorusu", directUrl: "https://www.youtube.com/watch?v=wIt_5zDFE3c", channelUrl: DIRECT_CHANNELS.mertHoca, note: "Sınavda en çok düşülen çeldiriciler ve Maarif modeli soru dili." },
      { day: "Salı", subj: "TYT Tarih & Coğrafya", topic: "Osmanlı Devleti Kuruluş + Türkiye İklimi", teacher: "Sosyal Kampı", target: "25 Tarih + 25 Coğrafya", directUrl: "https://www.youtube.com/watch?v=9ra55hD5WA4", channelUrl: DIRECT_CHANNELS.rustuHoca, note: "Tımar sistemi, divan yapısı ve Türkiye'de yer şekilleri." },
      { day: "Çarşamba", subj: "TYT Geometri", topic: "Çemberde Uzunluk ve Dairede Alan", teacher: "Kenan Kara", target: "30 Geometri Sorusu", directUrl: "https://www.youtube.com/watch?v=OT33sWOXolY", channelUrl: DIRECT_CHANNELS.kenanKara, note: "Teğet-kiriş özellikleri ve π.r^2 daire dilimi alanı." },
      { day: "Perşembe", subj: "TYT Fizik & Deneme", topic: "Optik 2: Küresel Aynalar, Kırılma ve Mercekler", teacher: "VIP Fizik", target: "Deneme Analizi + 20 Fizik", directUrl: "https://www.youtube.com/watch?v=WaOjpibIQpk", channelUrl: DIRECT_CHANNELS.vipFizik, note: "Snell yasası, odak noktası ve merceklerde görüntü oluşumu." },
      { day: "Cuma", subj: "TYT Tarih", topic: "Kurtuluş Savaşı ve İnkılap Tarihi", teacher: "Sosyal Kampı", target: "30 Tarih Sorusu + 20 Paragraf", directUrl: "https://www.youtube.com/watch?v=Q7kLglipMNc", channelUrl: DIRECT_CHANNELS.rustuHoca, note: "Kongreler, Misak-ı Milli ve antlaşmaların sebep-sonuçları." },
      { day: "Cumartesi", subj: "TYT Geometri & Kimya", topic: "Katı Cisimler (Prizma, Silindir) + Kimya Denemesi", teacher: "Kenan Kara & Görkem Şahin", target: "25 Geo + 1x TYT Kimya Denemesi", directUrl: "https://www.youtube.com/watch?v=hm9ppztvvos", channelUrl: DIRECT_CHANNELS.gorkemSahin, note: "Hacim (Taban alanı x Yükseklik) ve yüzey alanı modellemeleri." },
      { day: "Pazar", subj: "Branş Denemeleri", topic: "1x TYT Fen Denemesi + 1x TYT Sosyal Denemesi", teacher: "Genel Analiz", target: "40 Fen/Sosyal Sorusu + Yanlış Analizi", directUrl: "https://www.youtube.com/watch?v=5lVVyveUgyQ", channelUrl: DIRECT_CHANNELS.drBiyoloji, note: "Fizik, Kimya, Biyoloji ve Sosyal branş denemesi analizi." }
    ]
  },
  {
    weekNum: 16, phaseId: 4,
    title: "16. Hafta: Büyük Zirve: Genel Denemeler & Eksik Kapatma",
    desc: "Kampın büyük finali: Genel deneme provası, yanlış defteri taranması ve sınava tam hazırlık.",
    days: [
      { day: "Pazartesi", subj: "Genel Deneme Provası", topic: "Tam Kapsamlı TYT Genel Denemesi 1", teacher: "Tüm Kadro", target: "120 Soru (165 Dakika Tam Odak)", directUrl: "https://www.youtube.com/watch?v=h4f3zX_xzYU", channelUrl: DIRECT_CHANNELS.eyupB, note: "Gerçek sınav süresine (165 dk) birebir uyarak optik formla çöz." },
      { day: "Salı", subj: "Derinlemesine Analiz", topic: "1. Denemenin Detaylı Video Analizi & Yanlış Defteri", teacher: "Eğitmenler", target: "Bütün Yanlışların Tekrar Çözümü", directUrl: "https://www.youtube.com/watch?v=XjSESXVm7gA", channelUrl: DIRECT_CHANNELS.mertHoca, note: "Hangi konulardan hata çıktığını listele ve formül defterini tara." },
      { day: "Çarşamba", subj: "Genel Tekrar", topic: "TYT Matematik & Fen En Çok Çıkan Soru Tipleri", teacher: "Eyüp B. & VIP Fizik", target: "40 Karma Soru Çözümü", directUrl: "https://www.youtube.com/watch?v=8G_YDMJekeQ", channelUrl: DIRECT_CHANNELS.vipFizik, note: "ÖSYM ve Maarif havuzunun vazgeçmediği klasik modeller." },
      { day: "Perşembe", subj: "Genel Deneme Provası", topic: "Tam Kapsamlı TYT Genel Denemesi 2", teacher: "Tüm Kadro", target: "120 Soru (165 Dakika Odaklanma)", directUrl: "https://www.youtube.com/watch?v=h4f3zX_xzYU", channelUrl: DIRECT_CHANNELS.eyupB, note: "Turlama taktiğini uygula: İlk turda yapamadıklarına işaret koyup geç." },
      { day: "Cuma", subj: "Türkçe & Sosyal Zirvesi", topic: "2. Deneme Analizi + Paragraf ve Sosyal Kavram Taraması", teacher: "Rüştü Hoca", target: "Deneme Yanlışları + 20 Kavram", directUrl: "https://www.youtube.com/watch?v=3QJl686CM_s", channelUrl: DIRECT_CHANNELS.rustuHoca, note: "Türkçe ve Sosyal'deki kavram kelimeleri sözlüğünü tekrar et." },
      { day: "Cumartesi", subj: "Geometri & Formül Zirvesi", topic: "Geometri ve Fen Formül/Kural Haritaları Tekrarı", teacher: "Kenan Kara & Görkem Şahin", target: "Tüm Formül Kartlarının Gözden Geçirilmesi", directUrl: "https://www.youtube.com/watch?v=9pp2wVcngdg", channelUrl: DIRECT_CHANNELS.kenanKara, note: "Görsel hafıza kartlarıyla üçgenler, optik ve mol kurallarını tara." },
      { day: "Pazar", subj: "BÜYÜK FİNAL", topic: "Kamp Başarı Değerlendirmesi & Net Hedefi Kontrolü", teacher: "Sen ve Başarın!", target: "Net Grafiğini Çıkar + Kutlama", directUrl: "https://www.youtube.com/watch?v=jklNFvh30wc", channelUrl: DIRECT_CHANNELS.mertHoca, note: "Tebrikler! Maarif TYT kampını sıfırdan zirveye tamamladın!" }
    ]
  }
];

export type Unit = { unitIndex: number; origWeek: number; origDay: string; dayKey: DayKey; phaseId: number; subj: string; topic: string; teacher: string; target: string; directUrl: string; channelUrl: string; note: string };
export const LINEAR_CURRICULUM: Unit[] = [];
WEEKS_DATABASE.forEach(w => {
  w.days.forEach((d, idx) => {
    LINEAR_CURRICULUM.push({
      unitIndex: LINEAR_CURRICULUM.length,
      origWeek: w.weekNum,
      origDay: d.day,
      dayKey: ALL_DAYS[idx] || 'Pzt',
      phaseId: w.phaseId,
      subj: d.subj,
      topic: d.topic,
      teacher: d.teacher,
      target: d.target,
      directUrl: d.directUrl,
      channelUrl: d.channelUrl,
      note: d.note
    });
  });
});

