import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SidePanelColumn from "./side-panel-column";

// Panda class names are space-separated atomic tokens. `toContain` on the
// className STRING is a substring test, so a check for "panel.side" also
// matches "panel.sideCompact" (a literal prefix) - a mutation that silently
// swaps one token for the other would still pass. Every positive assertion
// here therefore matches a WHOLE class token via the split class list.
// No numeric assertions here: jsdom does not do layout, so the geometry
// this recipe produces (stacked below `lg`, docked column at/above it) is
// verified in the Playwright CT specs instead.
function classTokens(el: HTMLElement) {
  return el.className.split(/\s+/);
}

describe("SidePanelColumn", () => {
  it("is static at every width (G1: stacked, not an absolute overlay)", () => {
    render(<SidePanelColumn data-testid="panel" />);

    const panel = screen.getByTestId("panel");
    const classes = classTokens(panel);

    expect(classes).toContain("pos_static");
    // No conditional (breakpoint-prefixed) position class anywhere - it's a
    // single flat value now, not a per-breakpoint variant.
    expect(classes.some((c) => /:pos_/.test(c))).toBe(false);
    expect(classes).not.toContain("pos_absolute");
    expect(classes).not.toContain("inset_0");
    expect(classes).not.toContain("left_[auto]");
    expect(classes).not.toContain("z_10");
  });

  it("is a full-width stacked row below lg, capped to half its column's height with its own scroll", () => {
    render(<SidePanelColumn data-testid="panel" />);

    const panel = screen.getByTestId("panel");
    const classes = classTokens(panel);

    expect(classes).toContain("w_full");
    expect(classes).toContain("max-w_[none]");
    expect(classes).toContain("max-h_[50%]");
    expect(classes).toContain("ov-y_auto");
  });

  it("becomes a static docked column at lg, sized to the compact token and capped by the side token", () => {
    render(<SidePanelColumn data-testid="panel" />);

    const panel = screen.getByTestId("panel");
    const classes = classTokens(panel);

    expect(classes).toContain("lg:w_panel.sideCompact");
    expect(classes).toContain("lg:max-w_panel.side");
    expect(classes).toContain("lg:max-h_[none]");
    expect(classes).toContain("bx-sh_[none]");
  });

  it("widens to the full panel token at desktop", () => {
    render(<SidePanelColumn data-testid="panel" />);

    const panel = screen.getByTestId("panel");
    const classes = classTokens(panel);

    expect(classes).toContain("desktop:w_panel.side");
  });

  it("puts the border on the axis facing the document: top below lg, left at/above lg", () => {
    render(<SidePanelColumn data-testid="panel" />);

    const panel = screen.getByTestId("panel");
    const classes = classTokens(panel);

    expect(classes).toContain("bd-t_[1px_solid_#BCBAB8]");
    expect(classes).toContain("lg:bd-t_[none]");
    expect(classes).toContain("bd-l_[none]");
    expect(classes).toContain("lg:bd-l_[1px_solid_#BCBAB8]");
  });

  it("always carries flexShrink, regardless of breakpoint", () => {
    render(<SidePanelColumn data-testid="panel" />);

    const panel = screen.getByTestId("panel");
    const classes = classTokens(panel);

    expect(classes).toContain("flex-sh_0");
  });

  it("forwards className and rest props onto the single styled node", () => {
    render(<SidePanelColumn data-testid="panel" className="extra" />);

    const panel = screen.getByTestId("panel");
    const classes = classTokens(panel);

    expect(classes).toContain("extra");
    // Same node carries both the recipe classes and the forwarded testid -
    // there is no wrapper (unlike ReadingColumn's full/split variants).
    expect(classes).toContain("lg:max-w_panel.side");
  });
});
