import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { SmokeBox } from "@/test/playwright-fixtures/smoke-box";
import { expect, test } from "@playwright/experimental-ct-react";

const SHOTS_DIR = resolve(__dirname, "../tasks/responsive/shots");

test("mounts a component and verifies a token-driven layout style end to end", async ({
  mount,
  page,
}, testInfo) => {
  const component = await mount(<SmokeBox />);

  await expect(component).toHaveCSS("width", "479px");

  const fitsViewport = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  );
  expect(fitsViewport).toBe(true);

  const ancho = testInfo.project.name.split("x")[0];
  mkdirSync(SHOTS_DIR, { recursive: true });
  await page.screenshot({ path: resolve(SHOTS_DIR, `smoke-${ancho}.png`) });
});
