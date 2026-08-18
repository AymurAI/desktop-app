import type { Locator } from "@playwright/experimental-ct-react";
import { expect } from "@playwright/experimental-ct-react";

/**
 * G1 criterion 1 (tasks/responsive-fixes/issues/G1-paneles-laterales.md):
 * `document.elementFromPoint()` at the center of a control's own
 * `boundingBox()` must resolve to that control itself or a descendant of it -
 * never a sibling/cousin node (like a docked panel) sitting visually on top.
 *
 * Compares by node IDENTITY (`el === hit || el.contains(hit)`), not a
 * `data-*` marker - that's what "that control or a descendant of it" means.
 * `locator.evaluate()` runs the comparison inside the page, so it already has
 * the real node identity with no `ElementHandle` juggling required.
 *
 * KNOWN FALSE NEGATIVE: if the hit node is an ANCESTOR of the located node
 * (e.g. a wrapping `<label>`), `el.contains(hit)` is false even though the
 * control is perfectly clickable. None of this file's current locators hit
 * that case (each targets the innermost interactive/text node), but if a
 * future control does, resolve it deliberately - locate the ancestor
 * instead, or extend the predicate with a comment explaining why - rather
 * than loosening this check silently.
 */
export async function expectHitTestable(locator: Locator, label: string) {
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error(
      `[hit-test] "${label}" is not rendered (boundingBox() is null) - an absent control is not a reachable one.`,
    );
  }

  const result = await locator.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const hit = document.elementFromPoint(cx, cy);
    return {
      ok: hit !== null && (el === hit || el.contains(hit)),
      hitTag: hit?.tagName ?? null,
      hitClass: hit instanceof HTMLElement ? hit.className : null,
    };
  });

  expect(
    result.ok,
    `[hit-test] "${label}": the point at its own center is covered by <${result.hitTag ?? "?"} class="${result.hitClass ?? ""}"> instead of the control itself (or a descendant of it).`,
  ).toBe(true);
}
