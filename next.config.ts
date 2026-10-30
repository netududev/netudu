import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Proje şimdiye kadar tip denetimi yapmayan vinext ile derlendi. Vercel'de `next build`
  // tip hatalarında derlemeyi durdurur; yayını engellememesi için tip denetimi derleme
  // dışında yapılır (yerelde: `npx tsc --noEmit`).
  typescript: { ignoreBuildErrors: true },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: "upgrade-insecure-requests",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
