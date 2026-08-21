import { resolve } from "node:path";
import { defineConfig } from "@playwright/experimental-ct-react";
import react from "@vitejs/plugin-react";

/**
 * Component-test harness for the responsive-layout plan
 * (tasks/responsive/plan.md). jsdom (Vitest) performs no layout, so numeric
 * CSS assertions and horizontal-overflow checks need a real browser engine.
 *
 * Viewports match the plan's six target widths.
 */
const VIEWPORTS: Record<string, { width: number; height: number }> = {
  "768x1024": { width: 768, height: 1024 },
  "1024x768": { width: 1024, height: 768 },
  "1366x768": { width: 1366, height: 768 },
  "1440x900": { width: 1440, height: 900 },
  "1920x1080": { width: 1920, height: 1080 },
  "2560x1440": { width: 2560, height: 1440 },
};

export default defineConfig({
  testDir: "./playwright",
  // E2E specs in this directory use the real dev server and router. CT aliases
  // @tanstack/react-router to a stub, so running them here would not cover the
  // navigation path they are meant to verify.
  testIgnore: "**/no-console-errors.spec.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: "list",
  use: {
    trace: "on-first-retry",
    ctPort: 3100,
    ctViteConfig: {
      // Supply our own @vitejs/plugin-react (already a devDependency, pinned
      // to the version compatible with this repo's vite@6) instead of
      // letting @playwright/experimental-ct-react pull in its own - that
      // bundled version requires vite@^8 and crashes against vite@6.4.3.
      plugins: [react()],
      resolve: {
        alias: {
          "@": resolve(__dirname, "src/renderer/src"),
          // ValidateDataset imports useNavigate/useParams directly; stub
          // them instead of mounting a real router (see the mock file for
          // why). Scoped to this CT harness only, not the app build.
          "@tanstack/react-router": resolve(
            __dirname,
            "playwright/mocks/tanstack-router-stub.ts",
          ),
        },
      },
    },
  },
  projects: Object.entries(VIEWPORTS).map(([name, viewport]) => ({
    name,
    use: { viewport },
  })),
});
