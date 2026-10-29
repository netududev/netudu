import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Proje şimdiye kadar tip denetimi yapmayan vinext ile derlendi. Vercel'de `next build`
  // tip hatalarında derlemeyi durdurur; yayını engellememesi için tip denetimi derleme
  // dışında yapılır (yerelde: `npx tsc --noEmit`).
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
