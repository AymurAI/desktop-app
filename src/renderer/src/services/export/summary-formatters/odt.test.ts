import type { RichTextParagraph } from "@aymurai/ui";
import { describe, expect, it } from "vitest";
import { paragraphToOdtXml } from "./odt";

describe("paragraphToOdtXml", () => {
  it("wraps plain text in a text:p with no style attributes", () => {
    const p: RichTextParagraph = {
      id: "p0",
      runs: [{ text: "hola", marks: [] }],
    };
    expect(paragraphToOdtXml(p)).toBe("<text:p>hola</text:p>");
  });

  it("wraps a bold run in a text:span with font-weight:bold", () => {
    const p: RichTextParagraph = {
      id: "p0",
      runs: [{ text: "hola", marks: [{ type: "bold" }] }],
    };
    expect(paragraphToOdtXml(p)).toBe(
      '<text:p><text:span style="font-weight:bold;">hola</text:span></text:p>',
    );
  });

  it("combines multiple marks into one style attribute", () => {
    const p: RichTextParagraph = {
      id: "p0",
      runs: [{ text: "hola", marks: [{ type: "bold" }, { type: "italic" }] }],
    };
    expect(paragraphToOdtXml(p)).toBe(
      '<text:p><text:span style="font-weight:bold;font-style:italic;">hola</text:span></text:p>',
    );
  });

  it("renders a highlight mark's color as a background-color", () => {
    const p: RichTextParagraph = {
      id: "p0",
      runs: [
        {
          text: "hola",
          marks: [{ type: "highlight", color: "#FDE27B" }],
        },
      ],
    };
    expect(paragraphToOdtXml(p)).toBe(
      '<text:p><text:span style="background-color:#FDE27B;">hola</text:span></text:p>',
    );
  });

  it("escapes XML-sensitive characters in the run text", () => {
    const p: RichTextParagraph = {
      id: "p0",
      runs: [{ text: "A & B < C", marks: [] }],
    };
    expect(paragraphToOdtXml(p)).toBe("<text:p>A &amp; B &lt; C</text:p>");
  });
});
