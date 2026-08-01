import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { TranscriptionEditorFixture } from "@/test/playwright-fixtures/transcription-editor-fixture";
import { TurnSidePanelFixture } from "@/test/playwright-fixtures/turn-side-panel-fixture";
import { Button } from "@aymurai/ui";
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

  // G1 criterio 5 (tasks/responsive-fixes/issues/G1-paneles-laterales.md):
  // misma guarda que file-annotator.spec.tsx - el panel de Voz a Texto
  // comparte la primitiva SidePanelColumn, asi que debe seguir siendo
  // `position: static` en los SEIS viewports (incluido 768). Commiteado en
  // T1 (e81c4e2) como valor plano sin variante responsive - poner esta
  // asercion en rojo exigiria revertir codigo ya commiteado, asi que NO se
  // ejercito por mutacion en este ticket: es una guarda de regresion
  // futura, no verificada por mutacion.
  await expect.soft(panel).toHaveCSS("position", "static");

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

/**
 * G4 issue 12 (tasks/responsive-fixes/issues/G4-anchos-fijos-y-truncados.md):
 * the title's editing `<input>` had no `width` at all, so it sat at the UA's
 * intrinsic width (~32px) instead of filling the reading column - measured
 * fixed at 358px in all six viewports regardless of how much room the
 * column actually had (up to 1314px unused at 2560).
 *
 * A SIBLING test, not appended to the "Modo Edición" test above: that one is
 * about G1's panel-stacking (whether the switch/pencil are reachable and
 * toggle correctly), this one is about the input's geometry once it's
 * visible - different focus, so it gets its own test rather than growing an
 * unrelated one. It deliberately REUSES that test's exact flow (mount with
 * `initialEditMode={false}`, `getByRole("switch")`, then the pencil by its
 * accessible name) rather than inventing a parallel one.
 *
 * LOCATOR TRAP the inherited criterion called out: `input[aria-label]` (a
 * generic attribute selector) matches the Toolbar's OWN search input first
 * in DOM order, not the title input - and that search input genuinely
 * varies in width across viewports on its own (up to ~622px from 1366,
 * via the Toolbar's internal `maxW` in the "search-switch" context), so a
 * mis-scoped test could appear to pass while measuring the wrong element
 * entirely. `getByRole("textbox", { name })` scopes by accessible role AND
 * name - it cannot match the search input (a different accessible name),
 * so this trap is structurally avoided rather than avoided by convention.
 */
test("Voz a Texto: title input fills the reading column width once in edit mode", async ({
  mount,
  page,
}, testInfo) => {
  const width = Number(testInfo.project.name.split("x")[0]);
  const component = await mount(
    <TranscriptionEditorFixture initialEditMode={false} />,
  );

  await component.getByRole("switch").click();
  await component
    .getByRole("button", { name: "Editar título de la transcripción" })
    .click();

  const titleInput = component.getByRole("textbox", {
    name: "Título de la transcripción",
  });
  await expect(titleInput).toBeVisible();

  // RELATIVE assertion against the measured reading column, not the six
  // hardcoded widths the intake report measured (720/616/958/865/1345/1672
  // at 768/1024/1366/1440/1920/2560) - a hardcoded number breaks the instant
  // the layout changes for an unrelated reason (G1 already changed how these
  // screens stack once); a measured difference between two elements in the
  // same column does not. Those six numbers are used below only as a sanity
  // check while running this test, never as constants it depends on.
  const SANITY_CHECK_WIDTHS: Record<number, number> = {
    768: 720,
    1024: 616,
    1366: 958,
    1440: 865,
    1920: 1345,
    2560: 1672,
  };

  const column = component.getByTestId("vtt-reading-column");
  const [inputBox, columnBox] = await Promise.all([
    titleInput.boundingBox(),
    column.boundingBox(),
  ]);

  expect(inputBox).not.toBeNull();
  expect(columnBox).not.toBeNull();
  if (inputBox && columnBox) {
    // Criterion 2's second clause ("...the input occupies at least the
    // reading column's width") - the contract offers this as an explicit
    // alternative to its first clause, not a softened gate. The first
    // clause (`scrollWidth <= clientWidth` with a 108-character title) is
    // NOT reachable with the current typography: 108 characters at
    // 32px/600-weight measure ~2112px, and the column is capped at
    // `content.split` = 1672px in edit mode - an `<input>` cannot wrap.
    // Making a 108-character title render whole would need a `<textarea>`
    // or a smaller edit-mode font-size; that's a separate design decision,
    // out of this ticket's scope.
    expect(Math.abs(inputBox.width - columnBox.width)).toBeLessThanOrEqual(1);

    const sanityWidth = SANITY_CHECK_WIDTHS[width];
    if (sanityWidth !== undefined) {
      expect(Math.abs(columnBox.width - sanityWidth)).toBeLessThanOrEqual(10);
    }
  }

  // Criterion 2, last part: at 768, the full-width input still doesn't
  // overflow its container.
  if (width === 768) {
    const fitsViewport = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    );
    expect(fitsViewport).toBe(true);
  }
});

// 33 characters ("Nombre Muy Largo Del Locutor Once") - the exact length the
// G4 intake measured overflowing the library's card by 18px at 1024 (panel)
// and 50px (the card's own content box).
const LONG_SPEAKER_NAME = "Nombre Muy Largo Del Locutor Once";

/**
 * G4 issue 13 (tasks/responsive-fixes/issues/G4-anchos-fijos-y-truncados.md):
 * @aymurai/ui's "Turno seleccionado" card overflows with a long speaker
 * name - 100% internal to the library (see `turnCardOverflowFix`'s docblock
 * in turn-side-panel.tsx for the exact nodes and the selector's reasoning),
 * fixed by a structural CSS selector passed as `className` on `<SidePanel>`.
 *
 * A SECOND, sibling defect shares the same root cause and the same
 * `currentSpeaker.label`: that same name also drives the speaker's own pill
 * in the "Personas sugeridas" section below the card (every existing speaker
 * always renders a pill there - see `turn-side-panel.tsx`'s `people` array,
 * not a fixture artifact). Fixed by `suggestedPersonPillFix` (see its
 * docblock in turn-side-panel.tsx) - both fixes are asserted below, on the
 * literal `vtt-side-panel` node, per the contract's criterion 3.
 *
 * Mounted via a standalone fixture (not `TranscriptionEditorFixture` plus
 * the turn-selection click flow above): `TurnSidePanel` needs no editor
 * context to render on its own (`useTranscriptionDispatch`'s default is a
 * no-op, and the component wraps its own `TooltipProvider`), and a
 * dedicated fixture can set the speaker's `label` to an exact, controlled
 * length instead of whatever the shared transcription fixture happens to
 * use.
 */
test("Voz a Texto: a long speaker name doesn't overflow the library's turn card or the panel", async ({
  mount,
}) => {
  expect(LONG_SPEAKER_NAME).toHaveLength(33);

  const component = await mount(
    <TurnSidePanelFixture speakerLabel={LONG_SPEAKER_NAME} />,
  );

  const panel = component.getByTestId("vtt-side-panel");
  // `SidePanel` has no rest-prop spread, so its root can't carry a testid
  // directly - locate it structurally, same pattern (and same
  // `toHaveCount(1)` check first) as the turn-selection flow above.
  const sidePanelRoot = panel.locator("> div");
  await expect(sidePanelRoot).toHaveCount(1);
  // The card ("Turno seleccionado") is the FIRST child of that root -
  // exactly the node `turnCardOverflowFix`'s selector targets.
  const card = sidePanelRoot.locator("> div").first();

  const nameSpan = card.getByText(LONG_SPEAKER_NAME, { exact: true });
  await expect(nameSpan).toBeVisible();
  // One assertion per property, as the contract requires: if a future
  // library bump changes the tree, this says exactly which of the two was
  // lost, rather than a single compound check hiding which one broke.
  await expect(nameSpan).toHaveCSS("white-space", "normal");
  await expect(nameSpan).toHaveCSS("overflow-wrap", "anywhere");

  // The time reads completely ("00:00") - the report's nuance was that the
  // time span doesn't truncate on its own; it's the CARD overflowing and
  // an ancestor clipping it that made it look cut off.
  const timeSpan = card.getByText("00:00", { exact: true });
  await expect(timeSpan).toBeVisible();

  // The selector reaches THREE spans (initials, name, time), not one - the
  // avatar's geometry must be asserted unchanged, not assumed: `AvatarPill`
  // (size "sm") is a fixed 24x24px box (`w:"6"`/`h:"6"`, `flexShrink:"0"`),
  // so `whiteSpace`/`overflowWrap` on its span cannot visibly affect it
  // (2 characters never wrap), but this proves it rather than assuming it.
  const avatarSpan = card.getByText("AB", { exact: true });
  const avatarBox = await avatarSpan.boundingBox();
  expect(avatarBox).not.toBeNull();
  if (avatarBox) {
    expect(avatarBox.width).toBeCloseTo(24, 0);
    expect(avatarBox.height).toBeCloseTo(24, 0);
  }

  const cardOverflows = await card.evaluate(
    (el) => el.scrollWidth > el.clientWidth,
  );
  expect(cardOverflows).toBe(false);

  // The current speaker's own pill in "Personas sugeridas": `people` puts
  // existing speakers first, and this fixture has exactly one speaker (the
  // current one), so the FIRST `[data-pill-root]` in DOM order is theirs -
  // same `LONG_SPEAKER_NAME`, verified with an exact-text match rather than
  // assumed from ordering.
  const pillRoots = component.locator("[data-pill-root]");
  const pillCount = await pillRoots.count();
  expect(pillCount).toBeGreaterThan(0);
  const firstPillNameSpan = pillRoots
    .first()
    .getByText(LONG_SPEAKER_NAME, { exact: true });
  await expect(firstPillNameSpan).toBeVisible();
  // Copying the card's two-property recipe is NOT enough here (measured,
  // not assumed - see suggestedPersonPillFix's docblock): flexShrink/
  // minWidth also had to change, so all four properties get their own
  // assertion.
  await expect(firstPillNameSpan).toHaveCSS("white-space", "normal");
  await expect(firstPillNameSpan).toHaveCSS("overflow-wrap", "anywhere");
  await expect(firstPillNameSpan).toHaveCSS("flex-shrink", "1");
  await expect(firstPillNameSpan).toHaveCSS("min-width", "0px");

  // Selector node count: `"& [data-pill-root] span"` should reach exactly
  // 2 spans per pill (the AvatarPill initials span + the name span) and
  // NOTHING from the "Nuevo" button (a plain `<button>` with an SVG icon and
  // a bare text child, no `<span>`) - verified here rather than assumed.
  const pillSpans = component.locator("[data-pill-root] span");
  await expect(pillSpans).toHaveCount(pillCount * 2);

  // Criterion 3, on the literal node the contract names: the PANEL itself
  // (not a substitute measurement on the card alone) has no horizontal
  // overflow, now that both sibling defects (card + pill) are fixed.
  const panelOverflows = await panel.evaluate(
    (el) => el.scrollWidth > el.clientWidth,
  );
  expect(panelOverflows).toBe(false);
});

// Sad path the contract calls out explicitly: a single 40-character word
// with no spaces to wrap at is exactly what `flexWrap: "wrap"` on the row
// would NOT have covered (there is no space for the row to wrap on), which
// is why `overflowWrap: "anywhere"` on the spans (breaks mid-word as a last
// resort) was chosen over it. Covers both fixed nodes (card AND panel, i.e.
// the pill too), same as the main test above.
const SINGLE_WORD_NAME = "A".repeat(40);

test("Voz a Texto: a single 40-character word with no spaces still doesn't overflow the turn card or the panel", async ({
  mount,
}) => {
  const component = await mount(
    <TurnSidePanelFixture speakerLabel={SINGLE_WORD_NAME} />,
  );

  const panel = component.getByTestId("vtt-side-panel");
  const card = panel.locator("> div").locator("> div").first();

  const nameSpan = card.getByText(SINGLE_WORD_NAME, { exact: true });
  await expect(nameSpan).toBeVisible();

  const cardOverflows = await card.evaluate(
    (el) => el.scrollWidth > el.clientWidth,
  );
  expect(cardOverflows).toBe(false);

  // Same single long word also appears in this speaker's own suggested-
  // people pill (the same mechanism as the main test above) - the panel
  // must not overflow because of it either.
  const firstPillNameSpan = component
    .locator("[data-pill-root]")
    .first()
    .getByText(SINGLE_WORD_NAME, { exact: true });
  await expect(firstPillNameSpan).toBeVisible();

  const panelOverflows = await panel.evaluate(
    (el) => el.scrollWidth > el.clientWidth,
  );
  expect(panelOverflows).toBe(false);
});

/**
 * G5 (tasks/responsive-fixes/issues/G5-alineacion-cromo.md), issue 08: the
 * Toolbar's search pill used to sit at a flat 48px from the left (its own
 * `px: "12"`, hardcoded by @aymurai/ui), while the reading column below it
 * moves with the viewport - 24/24/24/48/48px gutter, then 368px (variant
 * `full`, cap `content.max` = 1824) or 204.5px (variant `split`, cap
 * `content.split` = 1672, resolved against `bodyColumn`'s pane, NOT the
 * viewport) once the cap engages at 2560. That's a mismatch in FOUR of the
 * six widths (768/1024/1366 by -24px, 2560 by +320px), not just the two the
 * original report measured (it never checked 768/1024).
 *
 * Figma evidence for "the transcript is right, the chrome is wrong": in
 * `A-vtt-sin-panel-2560.png` (edit mode off) the search bar, title, text and
 * player bar all start at the same x (~371 in frame coordinates) and the
 * toolbar->"Modo Edición" group measures ~1824px, exactly rule A's cap
 * centered ((2560-1824)/2 = 368 ~ 371); in `B-vtt-con-panel-2560.png` (edit
 * mode on) the search bar and title share that same left edge too. The fix
 * makes the toolbar ADOPT the transcript's position, not the other way
 * around.
 */
const expectedToolbarPaddingLeft: Record<
  string,
  { full: string; split: string }
> = {
  "768x1024": { full: "24px", split: "24px" },
  "1024x768": { full: "24px", split: "24px" },
  "1366x768": { full: "24px", split: "24px" },
  "1440x900": { full: "48px", split: "48px" },
  "1920x1080": { full: "48px", split: "48px" },
  "2560x1440": { full: "368px", split: "204.5px" },
};

// The search pill sits 2 DOM hops above the `<input>` (input -> its own
// icon/text flex wrapper -> the bordered pill) - verified against
// @aymurai/ui's dist/index.js. NOT the `<input>` itself: it has its own
// inner padding and starts at x=93 when the pill starts at x=48 (the
// contract's own pre-fix measurement) - measuring the input would fail (or
// pass) for a reason unrelated to the toolbar's gutter.
const TOOLBAR_CONTENT_FROM_INPUT_XPATH = "xpath=../..";
// The toolbar ROOT - the node the Toolbar library itself appends our
// `className` to, alongside its own `px: "12"` class - is 3 hops further up
// from the search pill (pill -> search-container -> row -> root).
const TOOLBAR_ROOT_FROM_CONTENT_XPATH = "xpath=../../..";

for (const isEditMode of [false, true]) {
  const variant = isEditMode ? "split" : "full";

  test(`Voz a Texto: toolbar lines up with the reading column (isEditMode=${isEditMode})`, async ({
    mount,
  }, testInfo) => {
    const component = await mount(
      <TranscriptionEditorFixture initialEditMode={isEditMode} />,
    );

    const searchInput = component.getByLabel("Buscar en la transcripción");
    const toolbarContent = searchInput.locator(
      TOOLBAR_CONTENT_FROM_INPUT_XPATH,
    );
    const toolbarContentBox = await toolbarContent.boundingBox();
    if (!toolbarContentBox) {
      throw new Error("Toolbar search pill (content) not found");
    }

    // Same variant expression the toolbar's className is keyed on
    // (index.tsx's `readingVariant`) - both this ReadingColumn and the
    // toolbar must move together.
    const readingColumn = component.getByTestId("vtt-reading-column");
    const readingColumnBox = await readingColumn.boundingBox();
    if (!readingColumnBox) throw new Error("Reading column not found");

    expect(
      Math.abs(toolbarContentBox.x - readingColumnBox.x),
    ).toBeLessThanOrEqual(2);

    // Criterion 8: one assertion on the actual CSS property, not just the
    // resulting geometry - if the "&&" override is ever dropped, the
    // toolbar's own `px: "12"` wins the cascade tie again (silently, since
    // nothing else here would catch a flat 48px that still happens to be
    // "close enough" at some width), and this goes red.
    const toolbarRoot = toolbarContent.locator(TOOLBAR_ROOT_FROM_CONTENT_XPATH);
    const paddingLeft = await toolbarRoot.evaluate(
      (el) => getComputedStyle(el).paddingLeft,
    );
    const width = testInfo.project.name;
    expect(paddingLeft).toBe(expectedToolbarPaddingLeft[width][variant]);
  });
}

/**
 * G5 (tasks/responsive-fixes/issues/G5-alineacion-cromo.md), issue 08,
 * second half: `AudioPlayer` (`@aymurai/ui`'s `Player`) measured the SAME
 * flat 48px padding as the toolbar - but it can't be fixed the same way.
 * `Player` doesn't accept a `className` at all (verified in
 * `dist/components/player/Player.d.ts`), so the content is inset via a
 * wrapper `<div>` around `<AudioPlayer>` instead
 * (transcription-editor/index.tsx:553-568), with the inset applied to the
 * wrapper's single child (the player's own root) via `readingInsetChildOverride`.
 *
 * CORRECTION TO THIS TICKET'S OWN PREMISE, measured empirically: the
 * inherited criteria said a bare `"& > *"` child selector would win against
 * the library's own utility class without doubling ("(0,1,1) beats
 * (0,1,0)"). That's incorrect CSS: combinators contribute NOTHING to
 * specificity, so `.wrapper > *` is (0,1,0) - the exact same bucket as the
 * library's class, tied and lost to import order (measured: with a bare
 * `"& > *"`, the player's padding stayed at 48px at every width). The fix
 * uses `"&& > *"` (specificity (0,2,0)) instead - see
 * `readingInsetChildOverride`'s docblock in reading-column.tsx for the full
 * measurement.
 *
 * SECOND correction, also measured: `AudioPlayer`'s wrapper sits OUTSIDE
 * `bodyColumn` (the pane) at full viewport width, while the toolbar sits
 * INSIDE it - so reusing `readingInset("split")` verbatim for the player
 * measured 444px at 2560 (viewport-relative), not the reading column's
 * actual 204.5px (pane-relative, pane = viewport minus the 479px side
 * panel). `readingInsetChildOverride.split` uses its own
 * `playerSplitInset` formula instead, which subtracts the side panel's own
 * width per breakpoint - see that file for the derivation. This is exactly
 * the "player needs its own viewport-minus-panel variant" scenario this
 * ticket asked to verify rather than assume; `full` needed no such
 * adjustment (no side panel exists in that mode at any width, so the pane
 * equals the viewport and the shared formula is already correct there).
 */
const expectedPlayerPaddingLeft: Record<
  string,
  { full: string; split: string }
> = {
  "768x1024": { full: "24px", split: "24px" },
  "1024x768": { full: "24px", split: "24px" },
  "1366x768": { full: "24px", split: "24px" },
  "1440x900": { full: "48px", split: "48px" },
  "1920x1080": { full: "48px", split: "48px" },
  "2560x1440": { full: "368px", split: "204.5px" },
};

// The rewind-5s button is the player's FIRST control - measured to sit
// flush against the root's own padding edge with no extra offset of its
// own (left=48 when the root's own padding-left is 48px). The "Reproducir"
// (play) button is the SECOND control, offset further by the rewind
// button's own width plus the row's gap (left=88 when padding is 48) - a
// naive test that measured the play button instead would report the wrong
// number for a reason unrelated to the fix, exactly the trap this ticket's
// objective calls out.
const REWIND_BUTTON_NAME = "Retroceder 5 segundos";
// button -> its own 3-button group <div> -> the row <div> -> the player
// root (verified against the actual rendered DOM).
const PLAYER_ROOT_FROM_REWIND_BUTTON_XPATH = "xpath=../../..";

for (const isEditMode of [false, true]) {
  const variant = isEditMode ? "split" : "full";

  test(`Voz a Texto: player content lines up with the reading column, chrome stays full-bleed (isEditMode=${isEditMode})`, async ({
    mount,
  }, testInfo) => {
    const component = await mount(
      <TranscriptionEditorFixture
        initialEditMode={isEditMode}
        footerActions={<Button>Finalizar</Button>}
      />,
    );

    const rewindButton = component.getByRole("button", {
      name: REWIND_BUTTON_NAME,
    });
    const playerRoot = rewindButton.locator(
      PLAYER_ROOT_FROM_REWIND_BUTTON_XPATH,
    );

    // THE CENTRAL ASSERTION: computed padding, not class presence. A class
    // can exist with zero matching CSS (reading-column.tsx's own
    // cross-file trap) or real CSS that still loses a specificity tie (this
    // ticket's own correction above) - either way a class-presence
    // assertion would pass while nothing actually moved.
    const width = testInfo.project.name;
    const padding = await playerRoot.evaluate((el) => {
      const s = getComputedStyle(el);
      return { left: s.paddingLeft, right: s.paddingRight };
    });
    expect(padding.left).toBe(expectedPlayerPaddingLeft[width][variant]);
    expect(padding.right).toBe(expectedPlayerPaddingLeft[width][variant]);

    // Criterion 1, player half: the rewind button (the player's actual
    // first control, not the play button - see the note above) lines up
    // with the reading column's own left edge.
    const readingColumn = component.getByTestId("vtt-reading-column");
    const [rewindBox, readingColumnBox] = await Promise.all([
      rewindButton.boundingBox(),
      readingColumn.boundingBox(),
    ]);
    expect(rewindBox).not.toBeNull();
    expect(readingColumnBox).not.toBeNull();
    if (rewindBox && readingColumnBox) {
      expect(Math.abs(rewindBox.x - readingColumnBox.x)).toBeLessThanOrEqual(2);
    }

    // Criterion 3 / full-bleed guard: the player's OWN root - not its
    // wrapper - still spans the full viewport and keeps its chrome. If
    // someone "simplifies" this by wrapping `<AudioPlayer>` itself in a
    // `ReadingColumn` instead of just its content, this goes red: the root
    // would shrink to the capped column width and lose its edge-to-edge
    // background/divider.
    const rootMetrics = await playerRoot.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return {
        left: r.left,
        width: r.width,
        backgroundColor: s.backgroundColor,
        borderTopWidth: s.borderTopWidth,
      };
    });
    expect(rootMetrics.left).toBe(0);
    expect(rootMetrics.width).toBe(Number(width.split("x")[0]));
    expect(rootMetrics.backgroundColor).toBe("rgb(255, 255, 255)");
    expect(rootMetrics.borderTopWidth).toBe("1px");

    // Criterion 5, regression guard: the vertical center shared between the
    // player and "Finalizar" stays intact once the player's content gets
    // its own padding-inline - `rightSlotSpacing`'s `marginLeft: "6"`
    // (audio-player.tsx) is what could get knocked out of alignment by a
    // wrong padding.
    if (width === "2560x1440") {
      const finishButton = component.getByRole("button", {
        name: "Finalizar",
      });
      const [rewindCenterBox, finishBox] = await Promise.all([
        rewindButton.boundingBox(),
        finishButton.boundingBox(),
      ]);
      expect(rewindCenterBox).not.toBeNull();
      expect(finishBox).not.toBeNull();
      if (rewindCenterBox && finishBox) {
        const rewindCenterY = rewindCenterBox.y + rewindCenterBox.height / 2;
        const finishCenterY = finishBox.y + finishBox.height / 2;
        expect(Math.abs(rewindCenterY - finishCenterY)).toBeLessThanOrEqual(1);
      }
    }
  });
}
