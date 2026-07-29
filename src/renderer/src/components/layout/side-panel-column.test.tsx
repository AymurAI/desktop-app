import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SidePanelColumn from "./side-panel-column";

// Panda class names are space-separated atomic tokens. `toContain` on the
// className STRING is a substring test, so a check for "panel.side" also
// matches "panel.sideCompact" (a literal prefix) - a mutation that silently
// swaps one token for the other would still pass. Every positive assertion
// here therefore matches a WHOLE class token via the split class list.
function classTokens(el: HTMLElement) {
  return el.className.split(/\s+/);
}

describe("SidePanelColumn", () => {
  it("is an absolute overlay by default (below lg)", () => {
    render(<SidePanelColumn data-testid="panel" />);

    const panel = screen.getByTestId("panel");
    const classes = classTokens(panel);

    expect(classes).toContain("pos_absolute");
    expect(classes).toContain("inset_0");
    expect(classes).toContain("left_[auto]");
    expect(classes).toContain("z_10");
    expect(classes).toContain("w_full");
    expect(classes).toContain("max-w_panel.side");
  });

  it("becomes a static column at lg, sized to the compact token", () => {
    render(<SidePanelColumn data-testid="panel" />);

    const panel = screen.getByTestId("panel");
    const classes = classTokens(panel);

    expect(classes).toContain("lg:pos_static");
    expect(classes).toContain("lg:w_panel.sideCompact");
    expect(classes).toContain("lg:bx-sh_[none]");
  });

  it("widens to the full panel token at desktop", () => {
    render(<SidePanelColumn data-testid="panel" />);

    const panel = screen.getByTestId("panel");
    const classes = classTokens(panel);

    expect(classes).toContain("desktop:w_panel.side");
  });

  it("always carries flexShrink and the border, regardless of breakpoint", () => {
    render(<SidePanelColumn data-testid="panel" />);

    const panel = screen.getByTestId("panel");
    const classes = classTokens(panel);

    expect(classes).toContain("flex-sh_0");
    expect(classes).toContain("bd-l_[1px_solid_#BCBAB8]");
  });

  it("forwards className and rest props onto the single styled node", () => {
    render(<SidePanelColumn data-testid="panel" className="extra" />);

    const panel = screen.getByTestId("panel");
    const classes = classTokens(panel);

    expect(classes).toContain("extra");
    // Same node carries both the recipe classes and the forwarded testid -
    // there is no wrapper (unlike ReadingColumn's full/split variants).
    expect(classes).toContain("max-w_panel.side");
  });
});
