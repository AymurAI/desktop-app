import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import FileCheck from "./index";

// Same mock shape as how-it-works.test.tsx: proves the default error
// message is actually SOURCED from i18next (namespace + key), not read back
// verbatim - a literal default would render identically under this mock by
// coincidence only if it happened to equal the mocked string, which it can't.
vi.mock("react-i18next", () => ({
  useTranslation: (namespace?: string) => ({
    t: (key: string) => `${namespace ?? "common"}:${key}`,
  }),
}));

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

  // Issue 07: the ellipsis treatment used to be a `"& p"` descendant
  // selector on `Wrapper`, reaching every `<p>` including the error text.
  it("does not clip a long error message with nowrap/overflow:hidden", () => {
    const longMessage =
      "Este es un mensaje de error muy largo que antes se elidia a 150px y ahora tiene que leerse completo en varias lineas sin cortarse.";
    render(<FileCheck fileName="e.docx" hasError errorMessage={longMessage} />);

    const errorText = screen.getByText(longMessage);
    expect(classTokens(errorText)).not.toContain("white-space_nowrap");
    expect(classTokens(errorText)).not.toContain("ov_hidden");
  });

  it("keeps the ellipsis treatment (and adds a tooltip) on the file name only", () => {
    render(
      <FileCheck fileName="e.docx" hasError errorMessage="Custom error" />,
    );

    const fileName = screen.getByText("e.docx");
    expect(classTokens(fileName)).toContain("white-space_nowrap");
    expect(classTokens(fileName)).toContain("ov_hidden");
    expect(fileName).toHaveAttribute("title", "e.docx");
  });

  it("sources the default error message from i18next, not a hardcoded literal", () => {
    render(<FileCheck fileName="f.docx" hasError />);

    expect(
      screen.getByText("common:fileCheck.defaultError"),
    ).toBeInTheDocument();
  });

  it("falls back to the default message instead of rendering an empty error block", () => {
    render(<FileCheck fileName="g.docx" hasError errorMessage="" />);

    const errorText = screen.getByText("common:fileCheck.defaultError");
    expect(errorText).toBeInTheDocument();
    expect(errorText.textContent).not.toBe("");
  });
});
