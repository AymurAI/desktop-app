import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Tab, TabName } from ".";

// Panda class names are space-separated atomic tokens; `toContain` on the
// className STRING is a substring test (e.g. a swapped-in longer token can
// still contain the old one as a prefix), so every check here matches a
// WHOLE class token via the split class list, same convention as
// side-panel-column.test.tsx / file-check/index.test.tsx.
function classTokens(el: Element) {
  return el.className.split(/\s+/);
}

describe("Tab (RSP-08e)", () => {
  it("applies the completed status's colours (anonymizer's selected tab)", () => {
    const { getByTestId } = render(
      <Tab status="completed" data-testid="tab">
        <span>Persona 1</span>
      </Tab>,
    );
    const classes = classTokens(getByTestId("tab"));

    expect(classes).toContain("bg_action.pressed");
    expect(classes).toContain("bd_[none]");
    expect(classes).toContain("[&_label,_&_span]:c_text.onbutton-alternative");
  });

  it("applies the focus status's colours, border and shadow (Set de Datos' selected decision)", () => {
    const { getByTestId } = render(
      <Tab status="focus" data-testid="tab">
        <span>Decisión 1</span>
      </Tab>,
    );
    const classes = classTokens(getByTestId("tab"));

    expect(classes).toContain("bg_action.focus");
    // Exact composite match with the preset: `borders.primary-alt` is
    // `1px solid #110041`, identical to Stitches' `$borderPrimaryAlt`.
    expect(classes).toContain("bd_primary-alt");
    // No preset shadow matches this exactly - kept as a raw escape so the
    // migration introduces zero rendered change (see index.ts's comment).
    expect(classes).toContain("bx-sh_[2px_2px_10px_rgba(17,_0,_65,_0.25)]");
    expect(classes).toContain("[&_label,_&_span]:c_text.onbutton-default");
  });

  it("applies the default status's colours (both screens' unselected tabs)", () => {
    const { getByTestId } = render(
      <Tab status="default" data-testid="tab">
        <span>Decisión 2</span>
      </Tab>,
    );
    const classes = classTokens(getByTestId("tab"));

    // One hex digit off the preset's own `bg.primary-alternative` (#E5E8FF) -
    // the exact legacy Stitches value (#E6E8FF) is kept as a raw escape.
    expect(classes).toContain("bg_[#E6E8FF]");
    expect(classes).toContain("bd_[none]");
    expect(classes).toContain("[&_label,_&_span]:c_text.onbutton-default");
  });

  it("falls back to the default status when none is passed (defaultVariants)", () => {
    const { getByTestId } = render(
      <Tab data-testid="tab">
        <span>Decisión 3</span>
      </Tab>,
    );
    expect(classTokens(getByTestId("tab"))).toContain("bg_[#E6E8FF]");
  });

  it("does not leak the `status` variant prop onto the DOM node", () => {
    const { getByTestId } = render(
      <Tab status="focus" data-testid="tab">
        <span>Decisión 1</span>
      </Tab>,
    );
    expect(getByTestId("tab")).not.toHaveAttribute("status");
  });

  it("shares its base layout/spacing tokens across all statuses", () => {
    const { getByTestId } = render(
      <Tab status="default" data-testid="tab">
        <span>x</span>
      </Tab>,
    );
    const classes = classTokens(getByTestId("tab"));

    expect(classes).toContain("bdr_xs");
    expect(classes).toContain("gap_2");
    expect(classes).toContain("p_4");
    expect(classes).toContain("fs_[16px]");
  });
});

describe("TabName (RSP-08e)", () => {
  it("keeps the ellipsis/overflow declarations and the label textStyle", () => {
    const { getByText } = render(<TabName>Decisión largísima</TabName>);
    const classes = classTokens(getByText("Decisión largísima"));

    expect(classes).toContain("tov_ellipsis");
    expect(classes).toContain("ov_hidden");
    expect(classes).toContain("white-space_nowrap");
    expect(classes).toContain("textStyle_label.md.default");
  });
});
