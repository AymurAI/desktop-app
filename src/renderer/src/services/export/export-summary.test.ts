import type { JSONContent } from "@aymurai/ui";
import { describe, expect, it, vi } from "vitest";
import { exportSummary } from "./export-summary";

// jsdom's Blob has no text()/arrayBuffer(), unlike a real browser's.
function blobToText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

const doc: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text: "Texto." }] }],
};

vi.mock("@/services/aymurai/queries", () => ({
  convertOdtToPdf: vi.fn(
    async (_odt: Blob) => new Blob(["pdf"], { type: "application/pdf" }),
  ),
}));

describe("exportSummary", () => {
  it("returns a plain-text blob for the txt format, with the title first and ending with the watermark", async () => {
    const blob = await exportSummary(doc, "Resumen", "txt");
    expect(blob.type).toBe("text/plain");
    expect(await blobToText(blob)).toBe(
      "Resumen\n\nTexto.\n\nResumen generado por AymurAI",
    );
  });

  it("returns an ODT blob for the odt format", async () => {
    const blob = await exportSummary(doc, "Resumen", "odt");
    expect(blob.type).toBe("application/vnd.oasis.opendocument.text");
  });

  it("converts to PDF via the existing convertOdtToPdf helper for the pdf format", async () => {
    const blob = await exportSummary(doc, "Resumen", "pdf");
    expect(blob.type).toBe("application/pdf");
  });
});
