import { fileURLToPath } from "node:url";
import vinext from "vinext";
import { defineConfig } from "vite";
import hostingConfig from "./.openai/hosting.json";
import { readExecutionProfile } from "./scripts/execution-profile.mjs";
import { sites } from "./build/sites-vite-plugin";

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID =
  "00000000-0000-4000-8000-000000000000";

const { d1, r2 } = hostingConfig;

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";
const managedLinux = readExecutionProfile() === "managed-linux";

// Cloudflare'e kendi hesabınla yayın: scripts/deploy-cloudflare.mjs bu değişkenleri doldurur.
// Tanımlı değilse yerel önizleme için yer tutucu adlar kullanılır.
const cf = {
  worker: process.env.CF_WORKER_NAME,
  d1Name: process.env.CF_D1_NAME || "site-creator-d1",
  d1Id: process.env.CF_D1_ID || SITE_CREATOR_PLACEHOLDER_DATABASE_ID,
  r2: process.env.CF_R2_BUCKET || "site-creator-r2",
};

const localBindingConfig = {
  ...(cf.worker ? { name: cf.worker } : {}),
  main: "vinext/server/fetch-handler",
  compatibility_flags: ["nodejs_compat"],
  d1_databases: d1
    ? [
        {
          binding: d1,
          database_name: cf.d1Name,
          database_id: cf.d1Id,
        },
      ]
    : [],
  r2_buckets: r2
    ? [
        {
          binding: r2,
          bucket_name: cf.r2,
        },
      ]
    : [],
};

export default defineConfig(async () => {
  // Use Miniflare's local Request.cf placeholder unless fetching is requested.
  process.env.CLOUDFLARE_CF_FETCH_ENABLED ??= "false";
  process.env.WRANGLER_SEND_METRICS ??= "false";

  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.WRANGLER_REGISTRY_PATH ??= ".wrangler/dev-registry";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    resolve: {
      // Cloudflare derlemesinde ortam erişimi `cloudflare:workers` üzerinden yapılır
      // (lib/platform-env.cloudflare.ts). Next.js/Vercel derlemesi lib/platform-env.ts'yi kullanır.
      alias: [
        {
          find: /^(?:@\/|(?:\.\.?\/)+)(?:lib\/)?platform-env(?:\.[cm]?[jt]s)?$/,
          replacement: fileURLToPath(new URL("./lib/platform-env.cloudflare.ts", import.meta.url)),
        },
      ],
    },
    server: {
      ...(managedLinux ? { host: "0.0.0.0", allowedHosts: ["terminal.local"] } : {}),
      ...(isCodexSeatbeltSandbox ? { watch: { useFsEvents: false, usePolling: true } } : {}),
    },
    plugins: [
      vinext(),
      sites({ mockAuth: !managedLinux }),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        inspectorPort: false,
        config: localBindingConfig,
      }),
    ],
  };
});
