import type { JSONContent } from "@aymurai/ui";
import { describe, expect, it } from "vitest";
import { documentToPlainText } from "./txt";

describe("documentToPlainText", () => {
  it("strips all marks, joining paragraphs with a blank line", () => {
    const doc: JSONContent = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Uno.", marks: [{ type: "bold" }] }],
        },
        { type: "paragraph", content: [{ type: "text", text: "Dos." }] },
      ],
    };
    expect(documentToPlainText(doc)).toBe("Uno.\n\nDos.");
  });
});
