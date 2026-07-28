import type { JSONContent } from "@aymurai/ui";
import { describe, expect, it } from "vitest";
import { SUMMARY_WATERMARK_TEXT } from "../watermark";
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
    expect(documentToPlainText(doc)).toBe(
      `Uno.\n\nDos.\n\n${SUMMARY_WATERMARK_TEXT}`,
    );
  });

  it("always appends the watermark as the final line, blank-line separated", () => {
    const doc: JSONContent = {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "X" }] }],
    };
    expect(documentToPlainText(doc).endsWith(SUMMARY_WATERMARK_TEXT)).toBe(
      true,
    );
  });

  it("renders a table as a pipe-separated header/separator/body block, not a blank gap", () => {
    const doc: JSONContent = {
      type: "doc",
      content: [
        {
          type: "table",
          content: [
            {
              type: "tableRow",
              content: [
                {
                  type: "tableHeader",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "Medida" }],
                    },
                  ],
                },
                {
                  type: "tableHeader",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "Plazo" }],
                    },
                  ],
                },
              ],
            },
            {
              type: "tableRow",
              content: [
                {
                  type: "tableCell",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "Exclusión" }],
                    },
                  ],
                },
                {
                  type: "tableCell",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "Inmediato" }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    expect(documentToPlainText(doc)).toBe(
      `Medida | Plazo\n--- | ---\nExclusión | Inmediato\n\n${SUMMARY_WATERMARK_TEXT}`,
    );
  });
});
