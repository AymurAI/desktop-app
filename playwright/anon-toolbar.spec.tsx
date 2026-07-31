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
 * panel state, so the label group itself is unaffected by opening/closing
 * the panel).
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

      return {
        gap:
          searchRect.top < labelRect.bottom && labelRect.top < searchRect.bottom
            ? labelRect.left - searchRect.right
            : null,
        labelBottom: labelRect.bottom,
        searchBottom: searchRect.bottom,
        labelRight: labelRect.right,
        contentRight:
          toolbarRect.right - Number.parseFloat(toolbarStyle.paddingRight),
      };
    });
    expect(toolbarGeometry).not.toBeNull();
    if (toolbarGeometry) {
      expect
        .soft(
          Math.abs(toolbarGeometry.labelRight - toolbarGeometry.contentRight),
        )
        .toBeLessThanOrEqual(1);

      if (toolbarGeometry.gap !== null) {
        expect.soft(Math.abs(toolbarGeometry.gap - 24)).toBeLessThanOrEqual(1);
        expect
          .soft(
            Math.abs(
              toolbarGeometry.labelBottom - toolbarGeometry.searchBottom,
            ),
          )
          .toBeLessThanOrEqual(1);
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
