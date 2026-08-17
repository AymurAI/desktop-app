import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SidePanelColumn from "./side-panel-column";

/**
 * Scoped version (tasks/responsive-fixes/plan-version-acotada.md).
 *
 * The Figma Responsive page specifies exactly one thing about this panel:
 * `sizes.panel.side` (479px), fixed, docked right, unchanged across
 * 1440/1920/2560 — all the extra room goes to the content pane. So the
 * contract here is the ABSENCE of breakpoints as much as the width itself:
 * every earlier variant of this primitive invented a narrow-window behaviour
 * (an absolute overlay, then a stacked row with a 360px `lg` tier) that no
 * frame ever described.
 *
 * These assertions are on emitted Panda classes rather than computed styles
 * because jsdom does not evaluate media queries — a responsive tier would show
 * up as a `lg:`/`desktop:`-prefixed class here whether or not it ever applies,
 * which is precisely what makes the "no tiers" half testable at this level.
 */
describe("SidePanelColumn", () => {
  const classesOf = (el: HTMLElement) => el.className.split(/\s+/);

  it("is a fixed 479px static column at every width", () => {
    render(<SidePanelColumn data-testid="panel" />);
    const classes = classesOf(screen.getByTestId("panel"));

    expect(classes).toContain("w_panel.side");
    expect(classes).toContain("pos_static");
    expect(classes).toContain("flex-sh_0");
  });

  it("declares no responsive tier at all", () => {
    render(<SidePanelColumn data-testid="panel" />);
    const prefixed = classesOf(screen.getByTestId("panel")).filter((c) =>
      /^(sm|md|lg|xl|2xl|desktop):/.test(c),
    );

    // Named in the failure so a reintroduced tier says which one it was.
    expect(prefixed).toEqual([]);
  });

  it("keeps the border on the edge facing the document", () => {
    render(<SidePanelColumn data-testid="panel" />);
    const classes = classesOf(screen.getByTestId("panel"));

    expect(classes.some((c) => c.startsWith("bd-l_"))).toBe(true);
    expect(classes.some((c) => c.startsWith("bd-t_"))).toBe(false);
  });

  it("forwards className and rest props onto the single styled node", () => {
    render(
      <SidePanelColumn
        className="consumer-class"
        data-testid="panel"
        aria-label="Panel"
      />,
    );
    const el = screen.getByTestId("panel");

    // One node, not a wrapper pair: this primitive has no gutter, so the
    // consumer's testid and the styling land on the same element.
    expect(classesOf(el)).toContain("consumer-class");
    expect(el.getAttribute("aria-label")).toBe("Panel");
    expect(classesOf(el)).toContain("w_panel.side");
  });
});
