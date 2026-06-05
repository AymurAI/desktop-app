import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "src/renderer/src"),
      "@/styled": resolve(__dirname, "src/renderer/src/styled"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["src/renderer/src/test/setup.ts"],
    include: ["src/renderer/src/**/*.{test,spec}.{ts,tsx}"],
  },
});
