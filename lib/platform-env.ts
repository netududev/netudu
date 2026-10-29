// Çalışma ortamından bağımsız ortam değişkenleri ve bağlamalar.
//
// - Cloudflare Workers (vinext + @cloudflare/vite-plugin): `cloudflare:workers` modülü vardır;
//   D1 (`DB`), R2 (`BUCKET`) bağlamaları ve gizli anahtarlar oradan okunur.
// - Vercel / Node.js (`next build`): bu modül yoktur. Değerler `process.env`'den okunur;
//   DB/BUCKET bağlamaları olmadığı için veritabanı ve depolama Supabase üzerinden çalışır
//   (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY ortam değişkenleri gerekir).
//
// `cloudflare:workers` statik olarak içe aktarılmaz: Next.js/Turbopack bu şemayı çözemez ve
// derleme "Module not found" hatasıyla durur. Bunun yerine çalışma anında, paketleyicilerin
// dokunmadığı dinamik bir içe aktarma denenir; Node.js'te bu içe aktarma hata verir ve
// sessizce process.env'e düşülür.
const CLOUDFLARE_MODULE = ["cloudflare", "workers"].join(":");

async function loadCloudflareEnv(): Promise<Record<string, unknown> | null> {
  try {
    const mod = (await import(
      /* webpackIgnore: true */ /* turbopackIgnore: true */ /* @vite-ignore */ CLOUDFLARE_MODULE
    )) as { env?: Record<string, unknown> };
    return mod?.env ?? null;
  } catch {
    return null;
  }
}

const cloudflareEnv = await loadCloudflareEnv();

/** Cloudflare'de bağlamalar, Vercel/Node'da process.env. */
export function platformEnv(): Record<string, unknown> {
  if (cloudflareEnv) return cloudflareEnv;
  return (typeof process !== "undefined" && process.env ? process.env : {}) as Record<string, unknown>;
}

export const isCloudflareRuntime = () => cloudflareEnv !== null;
