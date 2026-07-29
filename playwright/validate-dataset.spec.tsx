import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { ValidateDatasetFixture } from "@/test/playwright-fixtures/validate-dataset-fixture";
import { expect, test } from "@playwright/experimental-ct-react";

const SHOTS_DIR = resolve(__dirname, "../tasks/responsive/shots");

/**
 * RSP-02b red baseline (see tasks/responsive/plan.md). This screen mounts
 * with `isAnnotable={false}` (matching the real Set de Datos route), so its
 * embedded FileAnnotator's own entities panel stays closed/hidden - the
 * 479px panel-width assertion is exercised by file-annotator.spec.tsx
 * instead, and this spec covers the document reading column plus the
 * overflow probe. `expect.soft` is used for the CSS check so a failure here
 * doesn't skip the screenshot or the (hard) overflow probe below it.
 */
test("Set de Datos validation screen fits the viewport", async ({
  mount,
  page,
}, testInfo) => {
  const component = await mount(<ValidateDatasetFixture />);

  // Document reading column (the embedded FileAnnotator's document pane):
  // today unconstrained (no max-width at all), not the 1824px "full" cap
  // this pane should get once T11 lands ReadingColumn variant="doc" here.
  const column = component.getByTestId("anon-reading-column");
  await expect.soft(column).toHaveCSS("max-width", "1824px");

  const ancho = testInfo.project.name.split("x")[0];
  mkdirSync(SHOTS_DIR, { recursive: true });
  await page.screenshot({ path: resolve(SHOTS_DIR, `dataset-${ancho}.png`) });

  const fitsViewport = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  );
  expect(fitsViewport).toBe(true);
});
