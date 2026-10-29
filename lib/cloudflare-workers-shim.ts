// Vercel'de `cloudflare:workers` yoktur; ortam değişkenleri process.env'den gelir, D1/R2 bağlamaları yoktur
// (veritabanı ve depolama Supabase üzerinden çalışır). next.config.ts yalnız Vercel derlemesinde bunu yönlendirir.
export const env = process.env as Record<string, unknown>;
