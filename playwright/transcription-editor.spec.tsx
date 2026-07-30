import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { TranscriptionEditorFixture } from "@/test/playwright-fixtures/transcription-editor-fixture";
import { expect, test } from "@playwright/experimental-ct-react";

const SHOTS_DIR = resolve(__dirname, "../tasks/responsive/shots");

/**
 * RSP-02b's original red baseline (see tasks/responsive/plan.md) has long
 * since gone green: T5-T8 gave this screen a ReadingColumn/SidePanelColumn,
 * and every numeric assertion below now passes. `expect.soft` is used for
 * the CSS checks so a failure here doesn't skip the screenshot or the (hard)
 * overflow probe below it - it still fails the test, it just lets the rest
 * of the run happen first (RSP-12c).
 */
test("Voz a Texto transcription editor fits the viewport", async ({
  mount,
  page,
}, testInfo) => {
  const component = await mount(<TranscriptionEditorFixture />);
  const ancho = testInfo.project.name.split("x")[0];

  // RSP-06a: SidePanelColumn (T6, approved) is 360px at the `lg` tier
  // (1024/1366) and 479px at/above `desktop` (1440+). The Figma spec
  // documents a flat 479px at every width; the sub-1440 collapse to the
  // compact token is a deliberate, design-review-pending decision (see
  // tasks/responsive/plan.md's T7 risk), not an oversight, so the 1024/1366
  // expectations are restated here rather than left at the original flat
  // 479. G1 (tasks/responsive-fixes/issues/G1-paneles-laterales.md): below
  // `lg` (768) the panel is now a full-width STACKED row rather than an
  // absolute overlay clipped to 479px by a flat `maxWidth` - `maxWidth`
  // only engages at `lg` and up now, so at 768 the panel measures the full
  // mounted width.
  const width = Number(ancho);
  const expectedPanelWidth =
    width < 1024 ? `${width}px` : width < 1440 ? "360px" : "479px";

  // Edit-mode side panel: the CT fixture never selects a turn, so this is
  // the placeholder (`emptyPanel`), not the real `SidePanel` - see the turn
  // selection check below for the real panel.
  const panel = component.getByTestId("vtt-side-panel");
  await expect.soft(panel).toHaveCSS("width", expectedPanelWidth);

  // Reading column: T8 wires this up to ReadingColumn, testid moved onto the
  // transcript column's capped inner node (the one that carries max-width),
  // sharing a `variant={isEditMode ? "split" : "full"}` expression with the
  // title's own ReadingColumn instance. The fixture mounts with
  // `isEditMode = true` (see transcription-editor-fixture.tsx), which selects
  // `variant="split"` and therefore rule B's `sizes.content.split` = 1672px
  // cap, not rule A's 1824px - `max-width` is a computed style, so it reads
  // 1672px at all six viewports regardless of the measured width. Toggling
  // the fixture to edit-mode-off to get 1824px is NOT an option: it would
  // remove TurnSidePanel from the DOM (index.tsx:481) and gut the
  // turn-selection coverage below, so this stays edit-mode-only.
  const column = component.getByTestId("vtt-reading-column");
  await expect.soft(column).toHaveCSS("max-width", "1672px");

  // FACT B: `body`'s `display: flex; flexDir: column; gap: "6"` moved onto
  // ReadingColumn's capped inner node via its forwarded `className`
  // (transcriptColumn) - verify the 24px (spacing token "6") inter-turn gap
  // actually survived the move, rather than trusting the class was applied.
  // Named mutation this should catch: dropping `gap: "6"` from
  // `transcriptColumn` in index.tsx collapses this to ~0.
  const turnBlocks = column.locator("> div");
  const turnBlockCount = await turnBlocks.count();
  expect(turnBlockCount).toBeGreaterThanOrEqual(2);
  const firstTurnBox = await turnBlocks.nth(0).boundingBox();
  const secondTurnBox = await turnBlocks.nth(1).boundingBox();
  if (firstTurnBox && secondTurnBox) {
    const gap = secondTurnBox.y - (firstTurnBox.y + firstTurnBox.height);
    expect(gap).toBeCloseTo(24, 0);
  }

  mkdirSync(SHOTS_DIR, { recursive: true });
  await page.screenshot({ path: resolve(SHOTS_DIR, `vtt-${ancho}.png`) });

  const fitsViewport = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  );
  expect(fitsViewport).toBe(true);

  // FACT D: SelectionToolbar stays a direct child of `body`, outside the
  // ReadingColumn, and its coordinates come from
  // `scrollRef.current.getBoundingClientRect()` (`body` is scrollRef) - drag
  // a real text selection inside a turn and verify the toolbar actually
  // lands over it, rather than trusting the wrap didn't disturb its offset
  // parent.
  const turnText = component.locator("[data-turn-id]").first();
  const turnTextBox = await turnText.boundingBox();
  if (!turnTextBox) throw new Error("No turn text found to select");
  await page.mouse.move(
    turnTextBox.x + 4,
    turnTextBox.y + turnTextBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    turnTextBox.x + Math.min(60, turnTextBox.width - 4),
    turnTextBox.y + turnTextBox.height / 2,
    { steps: 5 },
  );
  await page.mouse.up();

  const assignToolbar = component.getByText("Asignar a…");
  await expect(assignToolbar).toBeVisible();
  const toolbarBox = await assignToolbar.boundingBox();
  if (toolbarBox) {
    const toolbarCenterX = toolbarBox.x + toolbarBox.width / 2;
    expect(toolbarCenterX).toBeGreaterThanOrEqual(turnTextBox.x - 20);
    expect(toolbarCenterX).toBeLessThanOrEqual(
      turnTextBox.x + turnTextBox.width + 20,
    );
    expect(Math.abs(toolbarBox.y - turnTextBox.y)).toBeLessThan(120);
  }

  // Dismiss the selection (an outside pointerdown, same as a real user
  // clicking elsewhere) before the turn-selection step below, which clicks
  // "Locutor 0" - a label the toolbar can otherwise render directly on top
  // of and intercept the click for.
  await page.evaluate(() => {
    document.body.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true }),
    );
  });

  // Selecting a turn swaps the placeholder for the real SidePanel (same
  // testid, turn-side-panel.tsx:139 / :314) - it must measure the same width
  // as the placeholder just asserted above, or the panel visibly resizes
  // the instant a turn becomes active.
  await component.getByText("Locutor 0").first().click();
  const wrapper = component.getByTestId("vtt-side-panel");
  await expect.soft(wrapper).toHaveCSS("width", expectedPanelWidth);

  // The wrapper assertion above cannot detect a regression of the
  // @aymurai/ui SidePanel's own `size` prop: the wrapper's width comes
  // entirely from SidePanelColumn's recipe and is independent of `size`.
  // `SidePanel` has no rest-prop spread (only `className`), so its root
  // can't carry a testid directly - but it's the wrapper's only element
  // child (TooltipProvider and the closed Dialog both render no DOM node),
  // so locate it structurally and verify that assumption before trusting it.
  const sidePanelRoot = wrapper.locator("> div");
  await expect(sidePanelRoot).toHaveCount(1);

  // SidePanelColumn's `borderLeft: [1px solid #BCBAB8]` under
  // `box-sizing: border-box` makes its content box 1px narrower than its
  // measured width, and SidePanel's recipe sets `maxW: full` on its root
  // alongside the intrinsic `size` width - so the root resolves to that
  // 1px-narrower content box: 478px where the wrapper is 479px, 359px
  // where the wrapper is 360px. A flat 479/360 would fail for a reason
  // unrelated to this check. Below `lg` (768) `borderLeft` is `none` (G1
  // puts the border on `borderTop` instead there, since the panel is a
  // stacked row, not a docked column) - no 1px discount applies there, so
  // the root matches the wrapper exactly at that width.
  const expectedRootWidth =
    width < 1024 ? expectedPanelWidth : width < 1440 ? "359px" : "478px";
  await expect.soft(sidePanelRoot).toHaveCSS("width", expectedRootWidth);

  const fitsViewportWithTurnSelected = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  );
  expect(fitsViewportWithTurnSelected).toBe(true);
});

/**
 * G1 criterion 2 (tasks/responsive-fixes/issues/G1-paneles-laterales.md,
 * Issue 11): "a 768 entras en Modo Edición y no podés salir". The default
 * fixture always starts in edit mode (see transcription-editor-fixture.tsx's
 * docblock - the OTHER test in this file and side-panel-stacking.spec.tsx
 * both depend on that default), so this test mounts with
 * `initialEditMode={false}` to actually exercise the off -> on -> off
 * transition, entirely with mouse clicks.
 *
 * `TurnSidePanel` is CONDITIONALLY MOUNTED, not hidden - `{isEditMode &&
 * <TurnSidePanel .../>}` (transcription-editor/index.tsx:505-506) - so the
 * "off" assertion is `toHaveCount(0)`, never `toBeHidden()` (the node does
 * not exist to be hidden).
 */
test("Voz a Texto: Modo Edición can be entered and exited at 768 with the mouse only", async ({
  mount,
}) => {
  const component = await mount(
    <TranscriptionEditorFixture initialEditMode={false} />,
  );

  const panel = component.getByTestId("vtt-side-panel");
  await expect(panel).toHaveCount(0);

  // The "Modo Edición" control is a `<label htmlFor={switchId}>` wrapping a
  // Radix `Switch` (`role="switch"`) plus a `<span>`. `role="switch"` is
  // clicked here because it's the unambiguous target - label-to-BUTTON click
  // forwarding is not as reliable as label-to-input (even though `button`
  // is labelable by spec), so clicking the span would need its own empirical
  // check that the forwarded click still toggles exactly once.
  const editModeSwitch = component.getByRole("switch");
  await editModeSwitch.click();
  await expect(panel).toBeVisible();

  // Second click on the SAME node turns it back off. If this instead left
  // the panel visible, that would mean the label forwarded a second click on
  // top of the one already delivered to the button (a double-toggle) - not
  // a locator problem.
  await editModeSwitch.click();
  await expect(panel).toHaveCount(0);

  // Re-enter for the pencil check below (Issue 11's other symptom: the
  // report measured it 100% covered by the panel, left: 491-519).
  await editModeSwitch.click();
  await expect(panel).toBeVisible();

  const editTitleButton = component.getByRole("button", {
    name: "Editar título de la transcripción",
  });
  await editTitleButton.click();

  // Clicking the pencil unmounts it and mounts the title input in its place
  // (transcription-editor/index.tsx:211-230) - assert that EFFECT, not the
  // button's persistence.
  await expect(editTitleButton).toHaveCount(0);
  const titleInput = component.getByRole("textbox", {
    name: "Título de la transcripción",
  });
  await expect(titleInput).toBeVisible();
});
