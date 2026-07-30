import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { HowItWorksFixture } from "@/test/playwright-fixtures/how-it-works-fixture";
import { HowItWorksModalFixture } from "@/test/playwright-fixtures/how-it-works-modal-fixture";
import { FeatureFlowEnum } from "@/types/features";
import { expect, test } from "@playwright/experimental-ct-react";

const SHOTS_DIR = resolve(__dirname, "../tasks/responsive/shots");

/**
 * G2 (tasks/responsive-fixes/issues/G2-onboarding-grid-modal.md), issue 02.
 * Anonymizer and Summarizer are the two features the report measured with
 * the worst same-row `<h2>` skew at 768 (30.8px / 22.4px) - real locale
 * strings of different lengths are what makes criterion 2 measure anything
 * at all; the near-uniform `namespace:key` mock in how-it-works.test.tsx
 * would make that assertion vacuous. Dataset and VoiceToText are added here
 * too (T4): criterion 1 asks for all 4 onboarding routes at 768, and
 * criterion 4 names `/app/DATA_SET/onboarding` specifically (760 vs 753, 7px
 * of page-wide horizontal scroll measured by the report) - Dataset is the
 * one feature whose real-locale copy the report actually measured and that
 * was missing from this matrix.
 */
const FEATURES = [
  { feature: FeatureFlowEnum.Anonymizer, slug: "anonymizer" },
  { feature: FeatureFlowEnum.Summarizer, slug: "summarizer" },
  { feature: FeatureFlowEnum.Dataset, slug: "dataset" },
  { feature: FeatureFlowEnum.VoiceToText, slug: "voice-to-text" },
] as const;

for (const { feature, slug } of FEATURES) {
  test(`HowItWorks tutorial grid (${slug}) collapses, aligns top, and fits the viewport`, async ({
    mount,
    page,
  }, testInfo) => {
    const width = Number(testInfo.project.name.split("x")[0]);
    const component = await mount(<HowItWorksFixture feature={feature} />);

    const h2s = component.locator("h2");
    await expect(h2s).toHaveCount(4);

    // Structural locators, verified against @aymurai/ui's TutorialGrid DOM
    // (dist/index.js): h2 -> title/description column div -> badge+text
    // column div -> the CARD (direct child of the grid root) -> the grid
    // root itself. Verify each hop count before trusting it, rather than
    // assume the ancestor distance holds across a package bump.
    const cards = h2s.locator("xpath=../../..");
    await expect(cards).toHaveCount(4);
    const grid = h2s.first().locator("xpath=../../../..");
    await expect(grid).toHaveCount(1);

    // Criterion 1a + cascade-win regression guard, together: track COUNT
    // (not the string - values are fractional/pixel and vary by width) and
    // that OUR override, not the library's own centered/2-column default,
    // is what actually won. If someone reorders main.tsx's imports, bumps
    // @aymurai/ui, or removes the "&&" wrapper in how-it-works.tsx, this
    // goes red with a clear message instead of silently reverting to the
    // library's broken default.
    const gridTemplateColumns = await grid.evaluate(
      (el) => getComputedStyle(el).gridTemplateColumns,
    );
    const trackCount = gridTemplateColumns.split(" ").length;
    expect(trackCount).toBe(width < 1024 ? 1 : 2);

    const cardAlignItems = await cards.evaluateAll((els) =>
      els.map((el) => getComputedStyle(el).alignItems),
    );
    for (const alignItems of cardAlignItems) {
      expect(alignItems).toBe("flex-start");
    }

    // Criterion 1, second half (768 only, the width the report measured):
    // no description paragraph falls below 4 words per line. Measured as an
    // average (words / rendered lines), not a strict per-line rect scan via
    // the `Range` API - noted here as a stronger fallback if the average
    // ever proves too lax, but it isn't today: the reported defect is 1-2
    // words/line, so 4 has real margin on both sides of the fix.
    if (width === 768) {
      const descriptions = h2s.locator("xpath=following-sibling::p");
      await expect(descriptions).toHaveCount(4);

      const metrics = await descriptions.evaluateAll((els) =>
        els.map((el) => {
          const text = (el.textContent ?? "").trim();
          const wordCount = text.split(/\s+/).filter(Boolean).length;
          const lineHeightPx = Number.parseFloat(
            getComputedStyle(el).lineHeight,
          );
          const lineCount = Math.max(
            1,
            Math.round(el.scrollHeight / lineHeightPx),
          );
          return wordCount / lineCount;
        }),
      );
      for (const wordsPerLine of metrics) {
        expect(wordsPerLine).toBeGreaterThanOrEqual(4);
      }
    }

    // Criterion 2: sibling <h2>s of the SAME row, grouped by index (0-1,
    // 2-3 - the override always produces exactly 2 columns from `lg` up),
    // not by rounding `top` - rounding could silently paper over a genuine
    // few-px misalignment. Skipped at 768 on purpose: a single column has
    // no row siblings there, so comparing elements from different rows
    // would be a vacuous pass for the wrong reason, not a real check.
    if (width > 768) {
      const tops = await h2s.evaluateAll((els) =>
        els.map((el) => el.getBoundingClientRect().top),
      );
      for (let row = 0; row < tops.length; row += 2) {
        const a = tops[row];
        const b = tops[row + 1];
        if (a === undefined || b === undefined) continue;
        expect(Math.abs(a - b)).toBeLessThanOrEqual(0.5);
      }
    }

    mkdirSync(SHOTS_DIR, { recursive: true });
    await page.screenshot({
      path: resolve(SHOTS_DIR, `how-it-works-${slug}-${width}.png`),
    });

    // Criterion 4, all six widths (free once mounted at each).
    const fitsViewport = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    );
    expect(fitsViewport).toBe(true);
  });
}

/**
 * G2 issue 03: the recomposed modal (how-it-works-modal.tsx). `DialogContent`
 * portals to `document.body` (see Dialog.d.ts / how-it-works-modal.tsx), so
 * once open the dialog lives OUTSIDE the mounted CT root - it's located via
 * `page.locator`, not `component.locator`.
 *
 * Runs against all FOUR features (T5): the contract's affected-routes header
 * names the modal "en las cuatro herramientas", and criterion 3 doesn't
 * scope to any one feature. Page-level coverage (the FEATURES matrix above)
 * does NOT subsume this: the report's own numbers show the modal's inner
 * container is ~46px narrower than the page's <main> at 768 (issue 03's
 * DialogContent measured 707px clientWidth vs issue 02's page <main> at
 * 753px), so copy that fits the page can still clip in the modal - which is
 * exactly why issue 03 exists separately from issue 02 even though the two
 * surfaces have shared the same grid override since T2. Since the documented
 * reason these assertions live in CT with the real locale is that copy
 * LENGTH is the variable being tested, running criterion 3 against only 2 of
 * 4 features would leave the narrower container unexercised for precisely
 * the two features (Summarizer, VoiceToText) the report never measured.
 */
const MODAL_FEATURES = [
  { feature: FeatureFlowEnum.Anonymizer, slug: "anonymizer" },
  { feature: FeatureFlowEnum.Summarizer, slug: "summarizer" },
  { feature: FeatureFlowEnum.Dataset, slug: "dataset" },
  { feature: FeatureFlowEnum.VoiceToText, slug: "voice-to-text" },
] as const;

for (const { feature, slug } of MODAL_FEATURES) {
  test(`HowItWorksModal (${slug}) opens/closes correctly, doesn't overflow, and shares the grid override with the page`, async ({
    mount,
    page,
  }, testInfo) => {
    const width = Number(testInfo.project.name.split("x")[0]);
    const component = await mount(<HowItWorksModalFixture feature={feature} />);

    // Criterion 6, part 1: the page's grid node/class, captured before the
    // modal ever opens. Same structural hops as the page-only test above.
    const pageH2s = component.locator("h2");
    await expect(pageH2s).toHaveCount(4);
    const pageGrid = pageH2s.first().locator("xpath=../../../..");
    await expect(pageGrid).toHaveCount(1);
    const pageGridClass = await pageGrid.getAttribute("class");

    // Criterion 5: open via the "?" trigger (the composed
    // DialogTrigger-asChild + TooltipTrigger-asChild nesting).
    const triggerButton = component.getByRole("button", {
      name: "Información sobre AymurAI",
    });
    await triggerButton.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Criterion 5: focus stays inside the dialog while it's open.
    const focusInDialog = await page.evaluate(() => {
      const el = document.querySelector('[role="dialog"]');
      return el?.contains(document.activeElement) ?? false;
    });
    expect(focusInDialog).toBe(true);

    // Criterion 6, part 2: the SAME TutorialGrid with the SAME
    // tutorialGridOverride class string - not a second grid implementation,
    // not a differently-configured one. Unlike the page-only test above, `h2`
    // inside the dialog also matches DialogTitle's own heading, so the grid
    // root is located structurally instead: DialogContent's rendered DOM has
    // exactly two direct children - DialogHeader (1st) and TutorialGrid's own
    // root (2nd) - verified against the actual rendered DOM.
    const modalGrid = dialog.locator("> *").nth(1);
    await expect(modalGrid.locator("h2")).toHaveCount(4);
    const modalGridClass = await modalGrid.getAttribute("class");
    expect(modalGridClass).toBe(pageGridClass);

    if (width === 768) {
      // Criterion 3: walk the WHOLE dialog subtree, not just DialogContent
      // itself - the intake measured two overflowing nodes (DialogContent
      // 769/707 AND the grid at 745/659), and an assertion on only one node
      // would let the other regress silently.
      const overflowing = await dialog.evaluate((root) => {
        const nodes = [root, ...root.querySelectorAll("*")];
        return nodes
          .filter((el) => el.scrollWidth > el.clientWidth)
          .map((el) => ({
            tag: el.tagName,
            class: el.className,
            scrollWidth: el.scrollWidth,
            clientWidth: el.clientWidth,
          }));
      });
      // PREDICTION (per the ticket): tutorialGridOverride should clear BOTH
      // the grid's own overflow and DialogContent's - DialogContent's box is
      // already viewport-bound (min(px, vw)), so its scrollWidth should only
      // have been > clientWidth as a CONSEQUENCE of its overflowing child
      // grid. If this still fails, that's a new finding to report with the
      // measurement, not a `size` change or a chrome patch.
      expect(overflowing).toEqual([]);

      // No card clips text at 768.
      const textNodes = dialog.locator("h2, p");
      const clipped = await textNodes.evaluateAll((els) =>
        els
          .filter((el) => el.scrollWidth > el.clientWidth + 1)
          .map((el) => el.textContent),
      );
      expect(clipped).toEqual([]);
    }

    mkdirSync(SHOTS_DIR, { recursive: true });
    // Visual verification (per the ticket: verify the reproduced
    // title/close-button styling VISUALLY, not only via gates).
    await page.screenshot({
      path: resolve(SHOTS_DIR, `how-it-works-modal-${slug}-${width}.png`),
    });

    // Criterion 5: closes with Escape.
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();

    // Criterion 5: closes with a click on the overlay (outside the content).
    // The overlay is `DialogContent`'s preceding sibling in the portal (Radix
    // renders `[Overlay, Content]`) - located structurally, not by an
    // `aym-*` class. A raw `page.mouse.click()` at overlay coordinates does
    // NOT register as a dismissal here (verified empirically); a normal
    // (non-forced) locator `.click()` does, so that's what's used.
    await triggerButton.click();
    await expect(dialog).toBeVisible();
    const overlay = dialog.locator("xpath=preceding-sibling::div[1]");
    await expect(overlay).toHaveCount(1);
    await overlay.click({ position: { x: 2, y: 2 } });
    await expect(dialog).toBeHidden();
  });
}
