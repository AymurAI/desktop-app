import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { FileAnnotatorFixture } from "@/test/playwright-fixtures/file-annotator-fixture";
import { expect, test } from "@playwright/experimental-ct-react";

const SHOTS_DIR = resolve(__dirname, "../tasks/responsive/shots");

/**
 * G3 (tasks/responsive-fixes/issues/G3-toolbar-y-cierre-panel.md), issue 05:
 * the anonimizador toolbar used to pass its label-controls group as
 * `Toolbar`'s `rightSlot`, which `@aymurai/ui` (dist/index.js) wraps in a div
 * that ALWAYS renders a 1px divider ahead of it in this context
 * ("anonimizador") - unconditionally, not only when the row wraps - so once
 * the toolbar wrapped at 1024/1366 the divider floated alone at the start of
 * the second row with nothing to its left. `SearchBar/index.tsx` now passes
 * the same group as `children` instead, which the library renders as a
 * direct child of the toolbar root with no wrapper and no divider.
 *
 * `FileAnnotatorFixture` always mounts with `isAnnotable` (so the label
 * group always renders), and starts with the entities panel OPEN
 * (`labelManagerOpen` seeded from `isAnnotable` in file-annotator/index.tsx).
 * Both panel states matter here because the toolbar shares the row with the
 * document pane, so its available width - and therefore whether it wraps -
 * differs between them; the divider bug and the reachability check below are
 * both about layout, not about `isAnnotable` (which stays true regardless of
 * panel state, so the label group always RENDERS either way). Its WIDTH does
 * change with panel state though (302.8px open vs 513.1px closed), because
 * the "Gestor de etiquetas" button (`managerButton` in SearchBar/index.tsx)
 * only renders while the panel is closed - that width swing is exactly why
 * G10 (tasks/responsive-fixes/issues/G10-toolbar-wrap-1024.md) has to check
 * both panel states rather than assuming one implies the other.
 */
const PANEL_STATES = ["open", "closed"] as const;

for (const panelState of PANEL_STATES) {
  test(`Anonimizador toolbar (panel ${panelState}): no orphaned divider, label stays one line, fits the viewport`, async ({
    mount,
    page,
  }, testInfo) => {
    const width = Number(testInfo.project.name.split("x")[0]);
    const component = await mount(<FileAnnotatorFixture />);

    if (panelState === "closed") {
      // G3 issue 06: the close button's accessible name is now a translated
      // aria-label ("Cerrar gestor de etiquetas"), not the literal "X" text
      // it used to render.
      await component
        .getByRole("button", { name: "Cerrar gestor de etiquetas" })
        .click();
      await expect(component.getByTestId("anon-side-panel")).toBeHidden();
    }

    const toolbar = component.getByTestId("anon-toolbar");

    const boxes = await toolbar.locator("*").evaluateAll((els) =>
      els
        .map((el) => {
          const r = el.getBoundingClientRect();
          return {
            width: r.width,
            left: r.left,
            right: r.right,
            top: r.top,
            bottom: r.bottom,
          };
        })
        .filter((b) => b.width > 0 && b.bottom > b.top),
    );

    // Criterion 1, main assertion: no leftover 1px-ish divider fragment
    // anywhere inside the toolbar, at any width or panel state. This is the
    // library's actual divider width (`w: "[1px]"`, dist/index.js) plus a
    // small margin for sub-pixel layout.
    const hairlines = boxes.filter((b) => b.width <= 1.5);
    expect(hairlines).toEqual([]);

    // Criterion 1, generic safety net: a broader net than the 1.5px check
    // above, so a future `@aymurai/ui` bump that renders a slightly wider
    // divider (or a different thin separator) still trips this rather than
    // silently passing. Any thin vertical element sharing a vertical band
    // with something to its LEFT is fine (an ordinary in-row divider); one
    // with nothing to its left in that band is exactly the orphaned-at-the-
    // start-of-a-wrapped-row shape this issue reported.
    const THIN_WIDTH_MAX = 4;
    const thinCandidates = boxes.filter((b) => b.width <= THIN_WIDTH_MAX);
    for (const thin of thinCandidates) {
      const hasLeftNeighbor = boxes.some(
        (other) =>
          other !== thin &&
          other.right <= thin.left + 0.5 &&
          other.top < thin.bottom &&
          other.bottom > thin.top,
      );
      expect(hasLeftNeighbor).toBe(true);
    }

    // Criterion 2: "Aplicar etiquetas" renders as exactly one line, measured
    // as rendered height vs line-height (NOT `getClientRects().length`, which
    // stays 1 whether the text is whole or split across two lines - it
    // counts block boxes, not layout lines).
    const label = component.getByText("Aplicar etiquetas");
    const labelMetrics = await label.evaluate((el) => ({
      height: el.getBoundingClientRect().height,
      lineHeight: Number.parseFloat(getComputedStyle(el).lineHeight),
    }));
    expect(Math.round(labelMetrics.height / labelMetrics.lineHeight)).toBe(1);

    const toolbarGeometry = await label.evaluate((el) => {
      const toolbarOuter = document.querySelector<HTMLElement>(
        '[data-testid="anon-toolbar"]',
      );
      const toolbarRoot = toolbarOuter?.firstElementChild;
      const labelGroup = el.parentElement;
      const searchInput = toolbarOuter?.querySelector("input");

      const directToolbarChild = (node: Element | null) => {
        let current = node;
        while (
          current?.parentElement &&
          current.parentElement !== toolbarRoot
        ) {
          current = current.parentElement;
        }
        return current?.parentElement === toolbarRoot ? current : null;
      };

      const searchItem = directToolbarChild(searchInput);
      if (
        !(toolbarRoot instanceof HTMLElement) ||
        !(labelGroup instanceof HTMLElement) ||
        !(searchItem instanceof HTMLElement)
      ) {
        return null;
      }

      const toolbarRect = toolbarRoot.getBoundingClientRect();
      const toolbarStyle = getComputedStyle(toolbarRoot);
      const labelRect = labelGroup.getBoundingClientRect();
      const searchRect = searchItem.getBoundingClientRect();
      const labelGroupStyle = getComputedStyle(labelGroup);

      return {
        // Same-row detection by VERTICAL OVERLAP, not by comparing `top`s:
        // this context's `Toolbar` root uses `alignItems: "flex-end"`
        // (dist/index.js: `alignItems: b ? "center" : "flex-end"`, `b` being
        // the "search-switch" context), so on a shared row the two items'
        // BOTTOMS line up while their TOPs can differ (the search input is
        // 48px tall, the label group 45.2px - a 2.8px top offset that a
        // `top`-equality check would misreport as "not the same row" in
        // every healthy panel-open case).
        gap:
          searchRect.top < labelRect.bottom && labelRect.top < searchRect.bottom
            ? labelRect.left - searchRect.right
            : null,
        labelBottom: labelRect.bottom,
        searchBottom: searchRect.bottom,
        labelLeft: labelRect.left,
        searchLeft: searchRect.left,
        labelRight: labelRect.right,
        contentRight:
          toolbarRect.right - Number.parseFloat(toolbarStyle.paddingRight),
        marginLeft: Number.parseFloat(labelGroupStyle.marginLeft),
        justifyContent: labelGroupStyle.justifyContent,
        // Controls only - the select's trigger and the manager button - not
        // the static "Aplicar etiquetas" label text, which isn't a control.
        groupControlHeights: Array.from(
          labelGroup.querySelectorAll('[role="combobox"], button'),
        ).map((control) => control.getBoundingClientRect().height),
      };
    });
    expect(toolbarGeometry).not.toBeNull();
    if (toolbarGeometry) {
      const sameRow = toolbarGeometry.gap !== null;
      const sameLeft =
        Math.abs(toolbarGeometry.labelLeft - toolbarGeometry.searchLeft) <= 1;

      // Criterion 1 (G10, reformulated from the contract's `top`-equality
      // version - see the comment above on why `top` isn't compared): the
      // group must either share a row with the search bar (`sameRow`, by
      // vertical overlap) or, once it wraps to its own row, start at the
      // search bar's left edge (`sameLeft`) instead of floating unaligned.
      // What's forbidden is neither of those being true at once.
      expect(sameRow || sameLeft).toBe(true);

      // G10: this only makes sense as "the group hugs the toolbar's right
      // edge" when it's sharing a row with the search bar - once it wraps
      // onto its own row (the two cases this ticket fixes), the group starts
      // at the left instead, so this assertion is scoped to `sameRow`.
      if (sameRow) {
        expect
          .soft(
            Math.abs(toolbarGeometry.labelRight - toolbarGeometry.contentRight),
          )
          .toBeLessThanOrEqual(1);

        expect.soft(Math.abs(toolbarGeometry.gap - 24)).toBeLessThanOrEqual(1);
        expect
          .soft(
            Math.abs(
              toolbarGeometry.labelBottom - toolbarGeometry.searchBottom,
            ),
          )
          .toBeLessThanOrEqual(1);
      }

      // G10: two SEPARATE computed-style assertions on the group, not one -
      // `marginLeft` is the property that actually fixes the bug, and
      // `justifyContent` is a defensive check for the internal-wrap case
      // (see SearchBar/index.tsx's `labelControls` comment); keeping them
      // apart means a future regression in either one names itself. Critic
      // (G10 repair): `marginLeft === 0` is only load-bearing when the group
      // WRAPS to its own row - on a shared row it's satisfied trivially even
      // with `ml: "auto"` restored, because the search wrapper's `flex: "1"`
      // already absorbs all the free space before the auto margin gets a
      // chance to do anything (same mechanism SearchBar/index.tsx's comment
      // documents: "computed margin-left measured at 0px in every same-row
      // case"). `justifyContent === "flex-start"` is the assertion with real
      // teeth at every width - it isn't neutralised by a shared row the same
      // way, and it's what actually catches `ml: "auto"` coming back per the
      // mutation test in SearchBar/index.test.tsx.
      expect(toolbarGeometry.marginLeft).toBe(0);
      expect(toolbarGeometry.justifyContent).toBe("flex-start");

      // Critic (G10 repair): a non-empty precondition before criterion 2's
      // loop - an empty `groupControlHeights` array makes the loop body never
      // run and the criterion passes green without checking anything. Not
      // hypothetical: the select trigger's `role="combobox"` is a HAND-WRITTEN
      // attribute (anonymizer-label-select.tsx, `RadixSelect.Trigger asChild`
      // wraps a plain `div`, not something Radix supplies), so losing it (or
      // Radix rendering its own trigger) silently empties this selector. With
      // the panel OPEN the "Gestor de etiquetas" button isn't rendered
      // (`{!isLabelManagerOpen && ...}`, SearchBar/index.tsx), so the select
      // trigger is the ONLY match and losing its role would zero the array
      // outright; with the panel CLOSED the button still matches, so the loop
      // would keep running while silently dropping coverage of the control
      // criterion 2 exists to protect (the ticket's ruled-out option (a) risk
      // is the select shrinking below its `minW: [150px]` floor). Assert the
      // exact count, not just non-empty, since it's known per panel state:
      // the select trigger alone when open, plus the manager button when
      // closed.
      expect(toolbarGeometry.groupControlHeights).toHaveLength(
        panelState === "open" ? 1 : 2,
      );

      // Criterion 2 (G10, from the contract): no control in the group renders
      // below 24px tall, as a guard against ever shrinking the select past
      // its `minW: [150px]` floor to close the 768-closed gap (option (a),
      // ruled out by this ticket's arithmetic).
      for (const height of toolbarGeometry.groupControlHeights) {
        expect(height).toBeGreaterThanOrEqual(24);
      }
    }

    // G3 issue 06, criteria 3 and 4: the LabelManager header only exists in
    // the DOM in a measurable state while the panel is OPEN (closed hides it
    // via `&[hidden]{ display: none }`, which zeroes every rect) - so these
    // assertions run only in that panel state.
    if (panelState === "open") {
      const closeButton = component.getByRole("button", {
        name: "Cerrar gestor de etiquetas",
      });
      const entitiesTab = component.getByRole("button", { name: "Entidades" });

      // Criterion 3: RELATIVE vertical-center distance between the close
      // button and the tabs, not the report's absolute 120/132/148 - G1
      // stacks the panel below `lg` and already shifted every `top`, so an
      // absolute assertion would fail for a cause outside this ticket.
      const centers = await Promise.all(
        [closeButton, entitiesTab].map((locator) =>
          locator.evaluate((el) => {
            const r = el.getBoundingClientRect();
            return r.top + r.height / 2;
          }),
        ),
      );
      expect(Math.abs(centers[0] - centers[1])).toBeLessThanOrEqual(1);

      // Criterion 4: >=24x24 clickable area, containing an <svg> (the
      // phosphor X icon replacing the old typographic glyph).
      const closeMetrics = await closeButton.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return {
          width: r.width,
          height: r.height,
          hasSvg: !!el.querySelector("svg"),
        };
      });
      expect(closeMetrics.width).toBeGreaterThanOrEqual(24);
      expect(closeMetrics.height).toBeGreaterThanOrEqual(24);
      expect(closeMetrics.hasSvg).toBe(true);
    }

    mkdirSync(SHOTS_DIR, { recursive: true });
    await page.screenshot({
      path: resolve(SHOTS_DIR, `anon-toolbar-${panelState}-${width}.png`),
    });

    // Criterion 5, overflow half: all six widths, both panel states.
    const fitsViewport = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    );
    expect(fitsViewport).toBe(true);

    // Criterion 5, reachability half: at 768, the search input and the label
    // must be hit-testable at their own center point, in BOTH panel states.
    // G1 (tasks/responsive-fixes/issues/G1-paneles-laterales.md, already
    // fixed and committed before this ticket started) stacks the entities
    // panel BELOW the document pane below `lg` (file-annotator/index.tsx's
    // `flexDirection={{ base: "column", lg: "row" }}`) - the toolbar lives
    // inside that same pane, above the panel row, so at 768 the panel cannot
    // overlay it in either state; G1's own side-panel-stacking.spec.tsx
    // hit-tests this same scenario directly.
    if (width === 768) {
      const search = component.getByRole("searchbox", {
        name: "Buscar en el documento",
      });

      const searchReachable = await search.evaluate((el) => {
        const r = el.getBoundingClientRect();
        const hit = document.elementFromPoint(
          r.left + r.width / 2,
          r.top + r.height / 2,
        );
        return hit !== null && el.contains(hit);
      });
      expect(searchReachable).toBe(true);

      const labelReachable = await label.evaluate((el) => {
        const r = el.getBoundingClientRect();
        const hit = document.elementFromPoint(
          r.left + r.width / 2,
          r.top + r.height / 2,
        );
        return hit !== null && el.contains(hit);
      });
      expect(labelReachable).toBe(true);
    }
  });
}
