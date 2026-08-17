import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { ValidateDatasetFixture } from "@/test/playwright-fixtures/validate-dataset-fixture";
import { expect, test } from "@playwright/experimental-ct-react";

const SHOTS_DIR = resolve(__dirname, "../tasks/responsive/shots");

/**
 * RSP-02b red baseline (see tasks/responsive/plan.md), turned green by T11.
 * This screen mounts with `isAnnotable={false}` (matching the real Set de
 * Datos route), so its embedded FileAnnotator's own entities panel stays
 * closed/hidden - the 479px panel-width assertion is exercised by
 * file-annotator.spec.tsx instead, and this spec covers the document reading
 * column plus the overflow probe. `expect.soft` is used for the CSS/width
 * checks so a failure here doesn't skip the screenshot or the (hard)
 * overflow probe below it.
 */
test("Set de Datos validation screen fits the viewport", async ({
  mount,
  page,
}, testInfo) => {
  const component = await mount(<ValidateDatasetFixture />);
  const ancho = testInfo.project.name.split("x")[0];
  const width = Number(ancho);

  // RSP-08: ValidateDataset passes FileAnnotator `narrowDocument`, which
  // forces ReadingColumn's rule-C ("doc") variant regardless of panel state
  // (the panel here never opens - `isAnnotable={false}`). `doc` sets no
  // `max-width` at all (it's a plain `width` calc: min(88% of the pane,
  // 1520px)), so an exact `toHaveCSS("max-width", "1824px")` - rule A's
  // number - can never pass against it; that was the wrong rule for this
  // screen once a fixed-width form column sits beside the document. The
  // widths are fractional (88% of an integer pane), so measure and compare
  // within the contract's +/-10px tolerance instead of an exact string
  // match, same convention as file-annotator.spec.tsx.
  //
  // The "pane" is the outer Grid's first column: full width below `lg`
  // (single-column stack), 50/50 with the form Stack at `lg` (1024-1439,
  // no design exists for that range), and viewport-minus-594
  // (sizes.panel.form) at `desktop` (>=1440).
  const pane = width < 1024 ? width : width < 1440 ? width / 2 : width - 594;
  const expectedDocWidth = Math.min(pane * 0.88, 1520);

  const column = component.getByTestId("anon-reading-column");
  const docBox = await column.boundingBox();
  expect.soft(docBox).not.toBeNull();
  if (docBox) {
    expect
      .soft(Math.abs(docBox.width - expectedDocWidth))
      .toBeLessThanOrEqual(10);
  }

  mkdirSync(SHOTS_DIR, { recursive: true });
  await page.screenshot({ path: resolve(SHOTS_DIR, `dataset-${ancho}.png`) });

  const fitsViewport = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  );
  expect(fitsViewport).toBe(true);
});
