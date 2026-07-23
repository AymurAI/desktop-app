import type { RichTextDocument } from "@aymurai/ui";
import { describe, expect, it } from "vitest";
import { documentToPlainText } from "./txt";

describe("documentToPlainText", () => {
  it("strips all marks, joining paragraphs with a blank line", () => {
    const doc: RichTextDocument = {
      paragraphs: [
        { id: "p0", runs: [{ text: "Uno.", marks: [{ type: "bold" }] }] },
        { id: "p1", runs: [{ text: "Dos.", marks: [] }] },
      ],
    };
    expect(documentToPlainText(doc)).toBe("Uno.\n\nDos.");
  });
});
