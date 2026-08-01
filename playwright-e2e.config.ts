import { defineConfig } from "@playwright/test";

const PORT = 3101;
const baseURL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./playwright",
  testMatch: "no-console-errors.spec.ts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  reporter: "list",
  use: {
    baseURL,
    viewport: { width: 1440, height: 900 },
  },
  webServer: {
    command: "pnpm dev:web --host 127.0.0.1",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      PORT: String(PORT),
      VITE_DEV_HOST: "http://127.0.0.1:8899",
    },
  },
});
