import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { defineConfig } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/** vite.config.ts is in client/ — courses live at client/public/courses */
const COURSES_DIR = path.resolve(__dirname, "public/courses");

function serveCoursePdfs(): Plugin {
  return {
    name: "serve-course-pdfs",
    configureServer(server) {
      server.middlewares.use("/courses", (req, res, next) => {
        const decodedPath = decodeURIComponent((req.url ?? "").split("?")[0] ?? "");
        const filePath = path.resolve(COURSES_DIR, decodedPath.replace(/^\//, ""));

        console.log("[PDF middleware] requested:", decodedPath);
        console.log("[PDF middleware] resolved to:", filePath);
        console.log("[PDF middleware] exists:", fs.existsSync(filePath));

        if (!fs.existsSync(filePath)) {
          console.error("[PDF middleware] FILE NOT FOUND:", filePath);
          next();
          return;
        }

        const stat = fs.statSync(filePath);
        if (!stat.isFile()) {
          console.error("[PDF middleware] NOT A FILE:", filePath);
          next();
          return;
        }

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Length", stat.size);
        res.setHeader("Cache-Control", "public, max-age=3600");
        fs.createReadStream(filePath).pipe(res);
      });
    },
  };
}

export default defineConfig({
  plugins: [serveCoursePdfs(), react()],
  publicDir: "public",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    host: true,
    fs: {
      strict: false,
    },
    proxy: {
      "/api": { target: "http://localhost:3011", changeOrigin: true, timeout: 120_000, proxyTimeout: 120_000 },
      "/courses": { target: "http://localhost:3011", changeOrigin: true },
      "/uploads": { target: "http://localhost:3011", changeOrigin: true, timeout: 120_000, proxyTimeout: 120_000 },
    },
  },
  preview: {
    port: 4173,
    host: true,
    proxy: {
      "/api": { target: "http://localhost:3011", changeOrigin: true, timeout: 120_000, proxyTimeout: 120_000 },
      "/courses": { target: "http://localhost:3011", changeOrigin: true },
      "/uploads": { target: "http://localhost:3011", changeOrigin: true, timeout: 120_000, proxyTimeout: 120_000 },
    },
  },
});
