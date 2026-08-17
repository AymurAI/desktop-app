import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { FileAnnotatorFixture } from "@/test/playwright-fixtures/file-annotator-fixture";
import { expect, test } from "@playwright/experimental-ct-react";

const SHOTS_DIR = resolve(__dirname, "../tasks/responsive/shots");

/**
 * RSP-02b red baseline (see tasks/responsive/plan.md), progressively turning
 * green as each ticket lands. `expect.soft` is used for the CSS checks so a
 * failure here doesn't skip the screenshot or the (hard) overflow probe
 * below it.
 */
test("Anonimizador entities panel fits the viewport", async ({
  mount,
  page,
}, testInfo) => {
  const component = await mount(<FileAnnotatorFixture />);
  const ancho = testInfo.project.name.split("x")[0];
  const width = Number(ancho);

  // RSP-07a/G1: SidePanelColumn (T6/T7, same primitive as Voz a Texto's
  // panel) is 360px at the `lg` tier (1024/1366) and 479px at/above `desktop`
  // (1440+). Below `lg` (768) the panel is now a full-width STACKED row
  // (G1, tasks/responsive-fixes/issues/G1-paneles-laterales.md) rather than
  // an absolute overlay clipped to 479px by a flat `maxWidth` - `maxWidth`
  // only engages at `lg` and up now, so at 768 the panel measures the full
  // mounted width. Mirrors T7's expectation exactly at 1024+ - it's the
  // identical component/breakpoints there.
  const expectedPanelWidth =
    width < 1024 ? `${width}px` : width < 1440 ? "360px" : "479px";

  const panel = component.getByTestId("anon-side-panel");
  await expect.soft(panel).toHaveCSS("width", expectedPanelWidth);

  // The wrapper assertion above cannot detect a regression of LabelManager's
  // own container width (now `width: "full"`, filling whatever box
  // SidePanelColumn provides) - it's the wrapper's only element child, so
  // locate it structurally and verify that assumption before trusting it,
  // following T7's precedent for SidePanel's root.
  const panelRoot = panel.locator("> div");
  await expect(panelRoot).toHaveCount(1);

  // SidePanelColumn's `borderLeft: [1px solid #BCBAB8]` under
  // `box-sizing: border-box` makes its content box 1px narrower than its
  // measured width, and LabelManager's container is `width: full` (100% of
  // that content box) with no border of its own - so the root resolves to
  // that 1px-narrower box: 478px where the wrapper is 479px, 359px where the
  // wrapper is 360px. A flat 479/360 would fail for a reason unrelated to
  // this check. Below `lg` (768) `borderLeft` is `none` (G1 puts the border
  // on `borderTop` instead there, since the panel is a stacked row, not a
  // docked column) - no 1px discount applies, so the root matches the
  // wrapper exactly at that width.
  const expectedRootWidth =
    width < 1024 ? expectedPanelWidth : width < 1440 ? "359px" : "478px";
  await expect.soft(panelRoot).toHaveCSS("width", expectedRootWidth);

  // Document reading column (RSP-07b). `FileAnnotatorFixture` mounts with
  // `isAnnotable`, so `labelManagerOpen` starts true and this pane gets
  // `ReadingColumn variant="doc"` (family D, rule C: 88% of the PANE - the
  // viewport minus the docked panel - capped at 1520px). `doc` sets no
  // `max-width` at all (it's a plain `width` calc), so an exact
  // `toHaveCSS("max-width", "1824px")` (rule A's number) can never pass
  // here - that would be the wrong rule for this fixture's state. The
  // widths are also fractional (88% of an integer pane), so we measure and
  // compare within the contract's +/-10px tolerance instead of an exact
  // string match. Below `lg` (1024) the panel stacks in its own row (G1) -
  // it no longer shrinks the document's WIDTH at all (the pane is the full
  // mounted width there, since the two now share a column instead of a
  // row); at/above `lg` the panel docks beside the document and does shrink
  // its width, same as before.
  const panelWidthAtThisSize = width < 1024 ? 0 : width < 1440 ? 360 : 479;
  const pane = width - panelWidthAtThisSize;
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
  await page.screenshot({ path: resolve(SHOTS_DIR, `anon-${ancho}.png`) });

  const fitsViewport = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  );
  expect(fitsViewport).toBe(true);

  // Family C / rule A: closing the entities panel is the only way this
  // fixture ever reaches `ReadingColumn variant="full"`. Use LabelManager's
  // own close button - it calls the SAME `onLabelManagerToggle` callback
  // SearchBar's own open button uses (file-annotator/index.tsx's
  // `toggleManagerLabel`); no new state is introduced. Once closed, the
  // panel is removed from layout (`&[hidden]{ display: none }`) so the
  // document pane is the full mounted width and the cap engages exactly
  // like MainContent/FileSelectionLayout's `full` variant: min(width-96,
  // 1824). G3 issue 06: the button's accessible name is now the translated
  // aria-label ("Cerrar gestor de etiquetas"), not the literal "X" glyph.
  await component
    .getByRole("button", { name: "Cerrar gestor de etiquetas" })
    .click();
  await expect(component.getByTestId("anon-side-panel")).toBeHidden();

  // ReadingColumn's gutter (RSP-04b) is responsive, not a flat 96px: 32px total
  // below `md` (768), 48px from `md` up to `desktop`, 96px only at/above
  // `desktop` (1440) - where the 1824px cap engages anyway.
  const fullGutter = width >= 1440 ? 96 : width >= 768 ? 48 : 32;
  const expectedFullWidth = Math.min(width - fullGutter, 1824);
  const fullBox = await column.boundingBox();
  expect.soft(fullBox).not.toBeNull();
  if (fullBox) {
    expect
      .soft(Math.abs(fullBox.width - expectedFullWidth))
      .toBeLessThanOrEqual(10);
  }
});
