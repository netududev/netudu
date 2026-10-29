import path from "node:path";
import type { NextConfig } from "next";

const shim = "./lib/cloudflare-workers-shim.ts";

const nextConfig: NextConfig = {
  // Vercel derlemesinde Cloudflare'e özgü `cloudflare:workers` içe aktarımını process.env uyarlayıcısına yönlendirir.
  ...(process.env.VERCEL
    ? {
        turbopack: { resolveAlias: { "cloudflare:workers": shim } },
        webpack(config: { resolve: { alias: Record<string, string> } }) {
          config.resolve.alias["cloudflare:workers"] = path.resolve(shim);
          return config;
        },
      }
    : {}),
};

export default nextConfig;
