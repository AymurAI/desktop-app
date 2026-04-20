import react from "@vitejs/plugin-react";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import { resolve } from "node:path";

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    envDir: resolve(__dirname),
    server: {
      port: 3000,
    },
    resolve: {
      alias: {
        "@": resolve("src/renderer/src"),
      },
    },
    plugins: [react()],
  },
});
