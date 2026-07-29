import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { TranscriptionEditorFixture } from "@/test/playwright-fixtures/transcription-editor-fixture";
import { expect, test } from "@playwright/experimental-ct-react";

const SHOTS_DIR = resolve(__dirname, "../tasks/responsive/shots");

/**
 * RSP-02b red baseline (see tasks/responsive/plan.md). None of these numeric
 * assertions are expected to pass yet - they gate T5-T8, which give this
 * screen a ReadingColumn/SidePanelColumn. `expect.soft` is used for the CSS
 * checks so a failure here doesn't skip the screenshot or the (hard)
 * overflow probe below it.
 */
test("Voz a Texto transcription editor fits the viewport", async ({
  mount,
  page,
}, testInfo) => {
  const component = await mount(<TranscriptionEditorFixture />);

  // Edit-mode side panel: today a fixed 360px (`turn-side-panel.tsx`'s
  // `emptyPanel`/SidePanel size="sm"), not Figma's 479px (T7).
  const panel = component.getByTestId("vtt-side-panel");
  await expect.soft(panel).toHaveCSS("width", "479px");

  // Reading column: today unconstrained (no max-width at all). 1824px is
  // rule A's (no-panel) cap; with the panel open (as mounted here) T8 will
  // apply rule B's 1671px cap instead - whichever a future ticket wires up,
  // "none" fails against either, so this stays a valid red baseline either way.
  const column = component.getByTestId("vtt-reading-column");
  await expect.soft(column).toHaveCSS("max-width", "1824px");

  const ancho = testInfo.project.name.split("x")[0];
  mkdirSync(SHOTS_DIR, { recursive: true });
  await page.screenshot({ path: resolve(SHOTS_DIR, `vtt-${ancho}.png`) });

  const fitsViewport = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  );
  expect(fitsViewport).toBe(true);
});
