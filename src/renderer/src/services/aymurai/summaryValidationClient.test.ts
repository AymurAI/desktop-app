import { beforeEach, describe, expect, it } from "vitest";
import { noopSummaryValidationClient } from "./noopSummaryValidation";

describe("noopSummaryValidationClient", () => {
  beforeEach(() => localStorage.clear());

  it("returns null for a document that was never saved", async () => {
    expect(await noopSummaryValidationClient.load("doc-1")).toBeNull();
  });

  it("round-trips a saved summary through localStorage", async () => {
    const summary = {
      documentId: "doc-1",
      title: "Resumen acta.docx",
      generatedSummary: "Original.",
      editedSummary: "Editado.",
    };
    await noopSummaryValidationClient.save(summary);
    expect(await noopSummaryValidationClient.load("doc-1")).toEqual(summary);
  });

  it("overwrites a previous save for the same documentId", async () => {
    await noopSummaryValidationClient.save({
      documentId: "doc-1",
      title: "A",
      generatedSummary: "A",
      editedSummary: "A",
    });
    await noopSummaryValidationClient.save({
      documentId: "doc-1",
      title: "B",
      generatedSummary: "B",
      editedSummary: "B",
    });
    expect(await noopSummaryValidationClient.load("doc-1")).toEqual({
      documentId: "doc-1",
      title: "B",
      generatedSummary: "B",
      editedSummary: "B",
    });
  });
});
