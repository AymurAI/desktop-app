import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  root: "src/renderer",
  server: {
    port: 5173,
  },
  build: {
    outDir: "../../out/renderer",
  },
  resolve: {
    alias: {
      "@": resolve("src/renderer/src"),
    },
  },
});
