import { describe, expect, it } from "vitest";
import { getAnonymizerInputFormat } from "../input-format";

describe("getAnonymizerInputFormat", () => {
  it("resolves a .docx extension", () => {
    expect(getAnonymizerInputFormat(new File([], "acta.docx"))).toBe("docx");
  });

  it("resolves a .DOCX extension case-insensitively", () => {
    expect(getAnonymizerInputFormat(new File([], "acta.DOCX"))).toBe("docx");
  });

  it("resolves a .pdf extension", () => {
    expect(getAnonymizerInputFormat(new File([], "acta.pdf"))).toBe("pdf");
  });

  it("falls back to the MIME type when there is no extension", () => {
    expect(
      getAnonymizerInputFormat(
        new File([], "acta", { type: "application/pdf" }),
      ),
    ).toBe("pdf");
  });

  it("falls back to the MIME type for docx when the extension is unrecognized", () => {
    expect(
      getAnonymizerInputFormat(
        new File([], "acta.bin", {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        }),
      ),
    ).toBe("docx");
  });

  it("returns null for an unsupported extension", () => {
    expect(getAnonymizerInputFormat(new File([], "acta.txt"))).toBeNull();
  });

  it("returns null when there is no extension and no recognizable MIME type", () => {
    expect(getAnonymizerInputFormat(new File([], "acta"))).toBeNull();
  });

  it("resolves the extension from a multi-dot filename", () => {
    expect(getAnonymizerInputFormat(new File([], "informe.final.docx"))).toBe(
      "docx",
    );
  });
});
