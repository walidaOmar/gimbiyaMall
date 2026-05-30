/**
 * vite.config.ts  —  project root
 *
 * Single Vite config.  Express (server/_core/index.ts) embeds Vite as
 * middleware in dev so ONE command (`pnpm dev`) starts everything.
 *
 * Tailwind v4 via @tailwindcss/vite (no postcss.config needed).
 */
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin, type ViteDevServer } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* ── tiny dev-log collector (no external deps) ─────────────────────────── */
function debugCollector(): Plugin {
  return {
    name: "debug-collector",
    configureServer(server: ViteDevServer) {
      server.middlewares.use("/__manus__/logs", (req, res, next) => {
        if (req.method !== "POST") return next();
        let body = "";
        req.on("data", (c) => { body += c.toString(); });
        req.on("end", () => {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), debugCollector()],

  resolve: {
    alias: {
      "@":       path.resolve(__dirname, "client/src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },

  // Vite's root is the client folder (index.html lives there)
  root:      path.resolve(__dirname, "client"),
  publicDir: path.resolve(__dirname, "client/public"),
  envDir:    path.resolve(__dirname),           // .env lives at project root

  build: {
    outDir:      path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },

  server: {
    host: true,
    allowedHosts: ["localhost", "127.0.0.1"],
    fs: {
      strict: false,   // allow imports from shared/ which is outside client/
    },
  },
});
