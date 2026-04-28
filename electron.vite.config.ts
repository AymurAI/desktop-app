/**
 * Electron-vite config for building the desktop app.
 * Used by the `dev`, `build`, and `build:*` scripts.
 *
 * Configures all three Electron processes: main, preload, and renderer.
 * `envDir` is set explicitly so `.env` files are resolved from the project root.
 */
import { resolve } from "node:path";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    envDir: resolve("."),
    server: {
      port: 3000,
    },
    resolve: {
      alias: {
        "@": resolve("src/renderer/src"),
      },
    },
    plugins: [
      tanstackRouter({
        target: "react",
        autoCodeSplitting: true,
      }),
      react(),
    ],
  },
});
