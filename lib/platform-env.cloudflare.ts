// Cloudflare Workers sürümü: yalnızca vinext/Vite derlemesinde, vite.config.ts'deki takma adla
// `lib/platform-env.ts` yerine kullanılır. Next.js (Vercel) bu dosyayı hiç içe aktarmaz.
import { env } from "cloudflare:workers";

export function platformEnv(): Record<string, unknown> {
  return env as unknown as Record<string, unknown>;
}
