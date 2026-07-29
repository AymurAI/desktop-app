import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { FileAnnotatorFixture } from "@/test/playwright-fixtures/file-annotator-fixture";
import { expect, test } from "@playwright/experimental-ct-react";

const SHOTS_DIR = resolve(__dirname, "../tasks/responsive/shots");

/**
 * RSP-02b red baseline (see tasks/responsive/plan.md). None of these numeric
 * assertions are expected to pass yet - they gate T9-T10, which give this
 * screen a SidePanelColumn/ReadingColumn. `expect.soft` is used for the CSS
 * checks so a failure here doesn't skip the screenshot or the (hard)
 * overflow probe below it.
 */
test("Anonimizador entities panel fits the viewport", async ({
  mount,
  page,
}, testInfo) => {
  const component = await mount(<FileAnnotatorFixture />);

  // Entities (label manager) panel: today `clamp(260px,32vw,400px)`, capped
  // at 400px, not Figma's 479px (T9).
  const panel = component.getByTestId("anon-side-panel");
  await expect.soft(panel).toHaveCSS("width", "479px");

  // Document reading column: today unconstrained (no max-width at all),
  // not the 1520px "doc" cap this pane should get once T10 lands.
  const column = component.getByTestId("anon-reading-column");
  await expect.soft(column).toHaveCSS("max-width", "1824px");

  const ancho = testInfo.project.name.split("x")[0];
  mkdirSync(SHOTS_DIR, { recursive: true });
  await page.screenshot({ path: resolve(SHOTS_DIR, `anon-${ancho}.png`) });

  const fitsViewport = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  );
  expect(fitsViewport).toBe(true);
});
