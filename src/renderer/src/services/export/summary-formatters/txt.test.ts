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
    expect(documentToPlainText(doc, "Resumen")).toBe(
      `Resumen\n\nUno.\n\nDos.\n\n${SUMMARY_WATERMARK_TEXT}`,
    );
  });

  it("always appends the watermark as the final line, blank-line separated", () => {
    const doc: JSONContent = {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "X" }] }],
    };
    expect(
      documentToPlainText(doc, "Resumen").endsWith(SUMMARY_WATERMARK_TEXT),
    ).toBe(true);
  });

  it("puts the title first, blank-line separated from the body, matching the transcription export's layout", () => {
    const doc: JSONContent = {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "X" }] }],
    };
    expect(documentToPlainText(doc, "Audiencia")).toBe(
      `Audiencia\n\nX\n\n${SUMMARY_WATERMARK_TEXT}`,
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
    expect(documentToPlainText(doc, "Resumen")).toBe(
      `Resumen\n\nMedida | Plazo\n--- | ---\nExclusión | Inmediato\n\n${SUMMARY_WATERMARK_TEXT}`,
    );
  });
});
