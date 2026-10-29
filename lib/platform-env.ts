// Çalışma ortamından bağımsız ortam değişkenleri ve bağlamalar — Vercel / Node.js sürümü.
//
// `next build` (Vercel) bu dosyayı kullanır: `cloudflare:workers` modülü yoktur, değerler
// `process.env`'den okunur. D1 (`DB`) ve R2 (`BUCKET`) bağlamaları olmadığı için veritabanı ve
// depolama Supabase üzerinden çalışır (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY gerekir).
//
// Cloudflare derlemesi (vinext + @cloudflare/vite-plugin) bu dosya yerine, vite.config.ts'deki
// takma adla `platform-env.cloudflare.ts`'yi kullanır; orada `cloudflare:workers` önceki gibi
// statik olarak içe aktarılır.
export function platformEnv(): Record<string, unknown> {
  return (typeof process !== "undefined" && process.env ? process.env : {}) as Record<string, unknown>;
}
