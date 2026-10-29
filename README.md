# Net Defterim · YKS yanlış defteri

Deneme sınavlarındaki yanlışlarını fotoğrafla yükle: adım adım çözüm, MEB Maarif Modeli'ne göre konu, uygun konu anlatımı videosu, aralıklı tekrar takvimi, yapay zekâ ders notları, aylık kişisel rapor ve net takibi. Herkes kendi hesabını açar; her defter yalnızca sahibine görünür.

## Özellikler

- **Hesaplar:** E-posta + şifreyle kayıt/giriş ve isteğe bağlı **Google ile giriş**. Şifre değiştirme/oluşturma, çıkış, hesabı tüm verileriyle silme. Şifreler PBKDF2-SHA256 (100.000 tur) ile saklanır, oturum belirteci veritabanında yalnızca SHA-256 özeti olarak tutulur (HttpOnly, SameSite=Lax çerez, 30 gün). Giriş ve kayıtta kaba kuvvet sınırı vardır.
- **İlk kurulum:** Kayıtta sınıf sorulur; hedef YKS yılı ve tahmini sınav tarihi (haziranın 3. cumartesisi) otomatik hesaplanır. Google ile gelenler kısa bir kurulum penceresi görür.
- **Soru yükleme:** Toplu fotoğraf, kamera, otomatik küçültme, hata türü (yanlış / boş / emin değildim), MEB konu menüsü.
- **Yapay zekâ çözümü:** OpenAI Responses API; cevap anahtarıyla çelişirse ikinci bağımsız çözüm; hata tipi etiketi.
- **Konu videosu:** YouTube Data API ya da anahtarsız arama; yeni müfredat/Maarif uyumlu anlatımlar öne alınır; "işime yaramadı" hatırlanır.
- **Aralıklı tekrar:** 1 → 3 → 7 → 14 → 30 → 60 gün.
- **Ders notları, aylık rapor, denemeler, Excel/CSV/PDF, JSON yedek.**
- **Günlük yapay zekâ hakları:** Sunucu tek bir OpenAI anahtarı kullanır; kişi başı günlük sınır vardır (varsayılan: 20 çözüm, 3 not, 2 rapor, 15 video yenileme). Başarısız çağrıda hak iade edilir. Yöneticiler sınırsızdır.
- **Yönetici:** `ADMIN_EMAILS` listesi; boşsa sistemde ilk açılan hesap.
- **Eski verinin devri:** Hesap sistemi eklenmeden önce kaydedilmiş veriler sistemde açılan **ilk hesaba** otomatik bağlanır.

## Yerelde çalıştırma

```bash
npm run install:ci
cp .env.example .env      # OPENAI_API_KEY vb. doldur
npm run dev               # http://localhost:5173
```

## Kendi Cloudflare hesabına yayınlama (ücretsiz plan yeterli)

```bash
npm run deploy:cloudflare     # Windows: cloudflare-yayinla.cmd dosyasına çift tıkla
```

Betik sırasıyla: Cloudflare girişi → D1 veritabanı → R2 fotoğraf deposu → derleme → veritabanı göçleri (`drizzle/*.sql`) → yayın → `.env` içindeki anahtarları Cloudflare'e gizli değişken olarak yükler. Sonunda `https://net-defterim.<hesabın>.workers.dev` adresini yazar. Oluşan kimlikler `.cloudflare.json` dosyasında tutulur; sonraki çalıştırmalar yalnızca günceller.

Google ile giriş için Google Cloud Console'da OAuth istemcisi oluştur ve yönlendirme adresi olarak `<adres>/api/auth/google/callback` ekle; `GOOGLE_CLIENT_ID` ve `GOOGLE_CLIENT_SECRET` değerlerini `.env`'e yazıp betiği yeniden çalıştır.

## Vercel'e yayınlama

Depoyu Vercel'e içe aktar; `vercel.json` derlemeyi `next build` yapar. Vercel'de D1/R2 yoktur, bu yüzden **Supabase zorunludur**: Project Settings > Environment Variables bölümüne `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (ve isteğe bağlı `SUPABASE_ANON_KEY`), `OPENAI_API_KEY`, `APP_URL` ve diğer `.env.example` değişkenlerini gir. Tabloları `supabase/schema.sql` ile oluştur. Google girişi için yönlendirme adresi `<APP_URL>/api/auth/google/callback` olmalıdır.

## Ortam değişkenleri

| Değişken | Açıklama |
|---|---|
| `OPENAI_API_KEY` | Yapay zekâ özellikleri (gizli) |
| `OPENAI_MODEL` | Varsayılan `gpt-5.6-luna` |
| `AI_LIMIT_SOLVE` / `AI_LIMIT_NOTE` / `AI_LIMIT_REPORT` / `AI_LIMIT_VIDEO` | Kişi başı günlük haklar |
| `ADMIN_EMAILS` | Sınırsız hakkı olan yöneticiler (virgülle) |
| `REGISTRATION_OPEN` | `false` ise yeni kayıt kapalı |
| `APP_URL` | Genel adres (Google dönüşü için) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google ile giriş (isteğe bağlı) |
| `YOUTUBE_API_KEY` | YouTube Data API v3 (isteğe bağlı) |

## Veri şeması

`db/schema.ts` ve `drizzle/0000–0004`. Hesap tabloları: `users`, `sessions`, `ai_usage`, `auth_attempts` (`0004_accounts.sql`). Tüm kayıtlar `user_id` ile sahibine bağlıdır; her sorgu bu alanla süzülür. Göç uygulanmamış yerel veritabanlarında `lib/server.ts › ensureSchema` eksik tabloları ilk istekte ekler.

## API

| Yol | Açıklama |
|---|---|
| `POST /api/auth/register` · `login` · `logout` | Kayıt, giriş, çıkış |
| `GET /api/auth/me` | Oturum ve giriş seçenekleri |
| `POST /api/auth/password` | Şifre değiştir/oluştur (diğer oturumlar kapanır) |
| `DELETE /api/auth/account` | Hesabı ve tüm verileri sil |
| `GET /api/auth/google` · `/api/auth/google/callback` | Google ile giriş |
| `/api/questions`, `/api/questions/[id]`, `/solve`, `/image` | Sorular |
| `/api/videos`, `/api/notes`, `/api/reports`, `/api/exams`, `/api/profile`, `/api/export`, `/api/import` | Diğer özellikler |

Ayrıntılı kullanım rehberi: `NET-DEFTERIM-REHBER.md`.
