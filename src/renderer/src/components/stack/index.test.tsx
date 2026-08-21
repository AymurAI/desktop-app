import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Stack from ".";

// Panda class names are space-separated atomic tokens; match whole tokens
// rather than substrings (same convention as tabs/index.test.tsx and
// file-check/index.test.tsx).
function classTokens(el: Element) {
  return el.className.split(/\s+/);
}

describe("Stack (RSP-08f)", () => {
  it("falls back to defaultVariants: row, wrap, start/start, spacing s, text.default", () => {
    const { getByTestId } = render(<Stack data-testid="stack">x</Stack>);
    const classes = classTokens(getByTestId("stack"));

    expect(classes).toContain("d_flex");
    expect(classes).toContain("flex-d_row");
    expect(classes).toContain("jc_start");
    expect(classes).toContain("ai_start");
    expect(classes).toContain("gap_2");
    expect(classes).toContain("c_text.default");
  });

  it("matches Decision.tsx's call site: spacing l -> gap 6 (24px)", () => {
    const { getByTestId } = render(
      <Stack spacing="l" data-testid="stack">
        x
      </Stack>,
    );
    expect(classTokens(getByTestId("stack"))).toContain("gap_6");
  });

  it("matches InfoHecho.tsx's call site: column direction, spacing m, align stretch", () => {
    const { getByTestId } = render(
      <Stack direction="column" spacing="m" align="stretch" data-testid="stack">
        x
      </Stack>,
    );
    const classes = classTokens(getByTestId("stack"));

    expect(classes).toContain("flex-d_column");
    expect(classes).toContain("gap_4");
    expect(classes).toContain("ai_stretch");
  });

  it("does not leak variant props onto the DOM node", () => {
    const { getByTestId } = render(
      <Stack direction="column" spacing="m" align="stretch" data-testid="stack">
        x
      </Stack>,
    );
    const node = getByTestId("stack");
    expect(node).not.toHaveAttribute("direction");
    expect(node).not.toHaveAttribute("spacing");
    expect(node).not.toHaveAttribute("align");
    expect(node).not.toHaveAttribute("wrap");
    expect(node).not.toHaveAttribute("justify");
    expect(node).not.toHaveAttribute("textColor");
  });
});
