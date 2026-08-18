import { FileAnnotatorFixture } from "@/test/playwright-fixtures/file-annotator-fixture";
import { TranscriptionEditorFixture } from "@/test/playwright-fixtures/transcription-editor-fixture";
import { ValidateDatasetFixture } from "@/test/playwright-fixtures/validate-dataset-fixture";
import { expect, test } from "@playwright/experimental-ct-react";

/**
 * Screenshot capture for visual review — NOT a regression guard.
 *
 * It asserts almost nothing on purpose: its job is to produce one PNG per
 * screen per width so a human can compare them against the Figma frames in
 * `tasks/responsive/figma/`. The numeric contract lives in the other specs,
 * which fail on their own; adding pixel assertions here would either duplicate
 * them or, worse, bless whatever the current rendering happens to be.
 *
 * The only assertion is that the screen actually rendered something — a blank
 * PNG is worse than no PNG, because it looks like evidence.
 *
 * Covers the five Figma families:
 *   A  Voz a Texto, no side panel      (Modo Edición off)
 *   B  Voz a Texto, with SidePanel     (Modo Edición on)
 *   C  Anonimizador, no panel          (entities panel closed)
 *   D  Anonimizador, with panel        (entities panel open)
 *   E  Set de Datos, 594px form
 *
 * Run: pnpm test:visual   → tasks/responsive-fixes/shots/<family>-<width>.png
 */

// Resolved against the process cwd (the repo root), NOT testDir — an earlier
// "../tasks/..." here wrote the whole set one level above the repo, and the run
// still reported 30 passed, since nothing asserts where the file landed.
const OUT = "tasks/responsive-fixes/shots";

test.describe("visual capture", () => {
  test("A — Voz a Texto sin panel", async ({ mount, page }) => {
    const c = await mount(
      <TranscriptionEditorFixture initialEditMode={false} />,
    );
    await expect(c).toBeVisible();
    await page.waitForTimeout(250);
    await page.screenshot({
      path: `${OUT}/A-vtt-sin-panel-${width(page)}.png`,
    });
  });

  test("B — Voz a Texto con panel", async ({ mount, page }) => {
    const c = await mount(
      <TranscriptionEditorFixture initialEditMode={true} />,
    );
    await expect(c).toBeVisible();
    await page.waitForTimeout(250);
    await page.screenshot({
      path: `${OUT}/B-vtt-con-panel-${width(page)}.png`,
    });
  });

  test("C — Anonimizador sin panel", async ({ mount, page }) => {
    const c = await mount(<FileAnnotatorFixture />);
    await expect(c).toBeVisible();

    // The fixture always starts with the panel open (family D). Close it via
    // the panel's own control rather than a prop, so the captured state is one
    // the user can actually reach.
    //
    // This used to be guarded by `if (await close.count())`, which failed open:
    // the locator matched nothing, the click never happened, and C came out
    // byte-identical to D at every width while the run reported 30 passed. A
    // capture that silently photographs the wrong state is worse than a missing
    // one, so the click is now unguarded and the panel's absence is asserted.
    // Real accessible name, not the i18n key: playwright/index.tsx imports
    // `@/constants/i18n`, so `t()` resolves against the Spanish locale here.
    await page
      .getByRole("button", { name: "Cerrar gestor de etiquetas" })
      .click();
    // Still in the DOM — file-annotator/index.tsx keeps it mounted and toggles
    // `hidden` — so this asserts invisibility, not absence.
    await expect(page.getByTestId("anon-side-panel")).toBeHidden();
    await page.waitForTimeout(250);
    await page.screenshot({
      path: `${OUT}/C-anon-sin-panel-${width(page)}.png`,
    });
  });

  test("D — Anonimizador con panel", async ({ mount, page }) => {
    const c = await mount(<FileAnnotatorFixture />);
    await expect(c).toBeVisible();
    await page.waitForTimeout(250);
    await page.screenshot({
      path: `${OUT}/D-anon-con-panel-${width(page)}.png`,
    });
  });

  test("E — Set de Datos", async ({ mount, page }) => {
    const c = await mount(<ValidateDatasetFixture />);
    await expect(c).toBeVisible();
    await page.waitForTimeout(250);
    await page.screenshot({ path: `${OUT}/E-dataset-${width(page)}.png` });
  });
});

function width(page: { viewportSize: () => { width: number } | null }): number {
  return page.viewportSize()?.width ?? 0;
}
