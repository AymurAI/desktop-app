import Header from "@/components/layout/header";
import { FeatureFlowEnum } from "@/types/features";
import { expect, test } from "@playwright/experimental-ct-react";

/**
 * Issue 01 (docs/responsive-test-2026-07-30/REPORT.md): AppHeader's
 * absolutely-centred stepper lands on top of the feature name below `lg`.
 * The mitigation is the unlayered rule in src/renderer/src/index.css.
 *
 * This spec is the regression guard for both halves of that rule, and it is
 * deliberately written so it cannot pass vacuously:
 *
 * - below `lg` it asserts the stepper is really gone (computed `display: none`,
 *   per the G2 lesson that a library style can silently win the cascade), so a
 *   rule that stopped matching — because the library renamed the
 *   `aria-label="Progress"` hook the selector depends on, or moved the CSS into
 *   a layer that outranks it — turns this red instead of quietly reappearing;
 * - at `lg` and above it asserts the stepper is still *visible* with all four
 *   badges, so the fix cannot regress into "hidden everywhere";
 * - at every width it asserts zero intersection between the title and every
 *   badge, which is the defect the issue actually reported.
 *
 * The CT config runs each test at all six target widths (768, 1024, 1366, 1440,
 * 1920, 2560), so the width-dependent branch below covers both sides from one
 * spec rather than hard-coding a viewport.
 *
 * Titles come from each feature's i18next `title` key (loaded by
 * playwright/index.tsx). "Resumen de Documento" is the worst case: it is the
 * longest name and overlapped the badge the most.
 */

const TOOLS: ReadonlyArray<readonly [FeatureFlowEnum, string]> = [
  [FeatureFlowEnum.Anonymizer, "Anonimizador"],
  [FeatureFlowEnum.Summarizer, "Resumen de Documento"],
  [FeatureFlowEnum.Dataset, "Set de Datos"],
  [FeatureFlowEnum.VoiceToText, "Voz a Texto"],
];

/**
 * Widths at and above which the stepper must stay visible — Panda's `xl`, and
 * the same value as index.css's media query. Not `lg`: the longest title,
 * "Resumen de Documento", still overlaps by 12px at 1024 and only clears at
 * 1048 (see the sweep recorded in index.css's comment).
 */
const XL = 1280;

for (const [feature, title] of TOOLS) {
  test(`${title}: the stepper never overlaps the feature name`, async ({
    mount,
    page,
  }) => {
    // currentStep 3 of 4: an inner step, so a regression that only centres the
    // first or last badge correctly still shows up here.
    const component = await mount(<Header feature={feature} currentStep={3} />);

    const heading = component.getByText(title, { exact: true });
    await expect(heading).toBeVisible();

    // A DOM locator, deliberately not getByRole: `display: none` removes the
    // element from the accessibility tree, so getByRole would match nothing
    // below the breakpoint and `toBeHidden()` would pass for an element that
    // was never found — the vacuous pass this spec is built to avoid.
    const stepper = component.locator('[role="list"][aria-label="Progress"]');
    const width = page.viewportSize()?.width ?? 0;
    expect(width, "CT project must define a viewport").toBeGreaterThan(0);

    if (width < XL) {
      // The hook must still exist in the DOM; if the library stopped rendering
      // it the selector in index.css is dead and this must not pass silently.
      await expect(
        stepper,
        "the aria hook index.css depends on is gone from the DOM",
      ).toHaveCount(1);
      // And the rule must actually take effect, not merely be in the sheet.
      const display = await stepper.evaluate(
        (el) => getComputedStyle(el).display,
      );
      expect(
        display,
        "stepper must compute to display:none below xl — if this is 'flex' the " +
          "index.css rule lost the cascade or its aria hook stopped matching",
      ).toBe("none");
    } else {
      // No regression at the widths where the header was always fine.
      await expect(stepper).toBeVisible();
      await expect(stepper.getByRole("listitem")).toHaveCount(4);
    }

    // The reported defect, measured the same way the issue measured it.
    const titleBox = await heading.boundingBox();
    expect(titleBox, "feature name must have a layout box").not.toBeNull();

    const badges = stepper.locator('[role="listitem"]');
    for (let i = 0; i < (await badges.count()); i++) {
      const badgeBox = await badges.nth(i).boundingBox();
      if (!badgeBox || !titleBox) continue; // hidden below lg: no box to compare
      const overlapX =
        Math.min(titleBox.x + titleBox.width, badgeBox.x + badgeBox.width) -
        Math.max(titleBox.x, badgeBox.x);
      const overlapY =
        Math.min(titleBox.y + titleBox.height, badgeBox.y + badgeBox.height) -
        Math.max(titleBox.y, badgeBox.y);
      const intersects = overlapX > 0 && overlapY > 0;
      expect(
        intersects,
        `step badge ${i + 1} overlaps "${title}" by ${Math.round(overlapX)}x` +
          `${Math.round(overlapY)}px at ${width}px`,
      ).toBe(false);
    }
  });
}
