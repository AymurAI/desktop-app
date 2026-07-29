import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import FileCheck from "./index";

// Panda class names are space-separated atomic tokens; match whole tokens
// rather than substrings (see side-panel-column.test.tsx). `getAttribute`
// rather than `.className` so this also works on the SVG root Spinner
// renders (SVGElement.className is an SVGAnimatedString, not a string).
function classTokens(el: Element) {
  return (el.getAttribute("class") ?? "").split(/\s+/);
}

describe("FileCheck", () => {
  it("renders the default (non-error, non-loading) state", () => {
    render(<FileCheck fileName="a.docx" />);

    const fileName = screen.getByText("a.docx");
    expect(classTokens(fileName)).toContain("textStyle_paragraph.sm.default");
    expect(screen.queryByText(/Error de guardado/)).not.toBeInTheDocument();

    const card = fileName.parentElement?.firstElementChild;
    expect(card).not.toBeNull();
    expect(classTokens(card as Element)).toContain("bg_bg.primary");
    expect(classTokens(card as Element)).toContain("bd-c_[#BCBAB8]");
  });

  it("renders the error state with ErrorText and the error Card token", () => {
    render(
      <FileCheck fileName="b.docx" hasError errorMessage="Custom error" />,
    );

    const errorText = screen.getByText("Custom error");
    expect(classTokens(errorText)).toContain("c_system.error");
    expect(classTokens(errorText)).toContain("textStyle_subtitle.sm.default");

    const card = screen.getByText("b.docx").parentElement?.firstElementChild;
    expect(card).not.toBeNull();
    expect(classTokens(card as Element)).toContain("bg_[#FFECE6]");
    expect(classTokens(card as Element)).toContain("bd-c_system.error");
  });

  it("does not render ErrorText when hasError is false", () => {
    render(<FileCheck fileName="c.docx" errorMessage="Custom error" />);

    expect(screen.queryByText("Custom error")).not.toBeInTheDocument();
  });

  it("renders the spinning Spinner while loading", () => {
    const { container } = render(<FileCheck fileName="d.docx" isLoading />);

    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(classTokens(svg as Element)).toContain("anim_spin");
  });
});
