import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const clientDir = __dirname;
const rootDir = path.resolve(clientDir, "..");
const reactRoot = path.join(rootDir, "node_modules/react");
const reactDomRoot = path.join(rootDir, "node_modules/react-dom");

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(clientDir, "./src"),
      react: reactRoot,
      "react-dom": reactDomRoot,
      "react/jsx-runtime": path.join(reactRoot, "jsx-runtime.js"),
      "react/jsx-dev-runtime": path.join(reactRoot, "jsx-dev-runtime.js"),
      "react-dom/client": path.join(reactDomRoot, "client.js"),
      "react-dom/test-utils": path.join(reactDomRoot, "test-utils.js"),
    },
    dedupe: ["react", "react-dom"],
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["tests/setup.ts"],
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    server: {
      deps: {
        inline: true,
      },
    },
  },
});
