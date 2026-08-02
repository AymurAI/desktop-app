import type { AllLabels } from "@/types/aymurai";
import { describe, expect, it } from "vitest";
import { generateSplits } from "./generateSplits";
import type { Annotation } from "./types";

const paragraph = "Se recomienda a Ana Perez, Directora General.";

describe("generateSplits", () => {
  it("keeps an extracted token as a split of type 'extracted' with its start/end", () => {
    const extracted: Annotation = {
      type: "extracted",
      paragraphId: "d:0",
      field: "destinatario:x1:nombre",
      start: 16,
      end: 25,
    };

    const splits = generateSplits(paragraph, [extracted]);

    expect(splits).toEqual([
      { type: "text", start: 0, end: 16 },
      { ...extracted },
      { type: "text", start: 25, end: paragraph.length },
    ]);
  });

  it("produces the same output for a tag-only input as before the fix (regression guard)", () => {
    const tag: Annotation = {
      type: "tag",
      paragraphId: "d:0",
      tag: "PER_NOMBRE" as AllLabels,
      start: 16,
      end: 25,
    };

    const splits = generateSplits(paragraph, [tag]);

    expect(splits).toEqual([
      { type: "text", start: 0, end: 16 },
      { ...tag },
      { type: "text", start: 25, end: paragraph.length },
    ]);
  });

  it("produces the same output for a search-only input as before the fix (regression guard)", () => {
    const search: Annotation = {
      type: "search",
      paragraphId: "d:0",
      start: 16,
      end: 25,
      searchMatchId: "match-1",
      searchIndex: 0,
      isActive: true,
    };

    const splits = generateSplits(paragraph, [search]);

    expect(splits).toEqual([
      { type: "text", start: 0, end: 16 },
      { ...search },
      { type: "text", start: 25, end: paragraph.length },
    ]);
  });

  it("hoists an overlapping search's identity onto the tag and suppresses the search (mergeSearchIntoTags enrichment path)", () => {
    const tag: Annotation = {
      type: "tag",
      paragraphId: "d:0",
      tag: "PER_NOMBRE" as AllLabels,
      start: 10,
      end: 20,
    };
    const search: Annotation = {
      type: "search",
      paragraphId: "d:0",
      start: 15,
      end: 25,
      searchMatchId: "match-1",
      searchIndex: 2,
      isActive: true,
    };

    const splits = generateSplits(paragraph, [tag, search]);

    expect(splits).toEqual([
      { type: "text", start: 0, end: 10 },
      {
        ...tag,
        searchMatchId: "match-1",
        searchIndex: 2,
        isActive: true,
      },
      { type: "text", start: 20, end: paragraph.length },
    ]);
  });

  it("keeps tag, search and extracted tokens together, at their exact offsets, when none overlap", () => {
    const tag: Annotation = {
      type: "tag",
      paragraphId: "d:0",
      tag: "PER_NOMBRE" as AllLabels,
      start: 16,
      end: 25,
    };
    const search: Annotation = {
      type: "search",
      paragraphId: "d:0",
      start: 27,
      end: 32,
      searchMatchId: "match-1",
      searchIndex: 0,
      isActive: false,
    };
    const extracted: Annotation = {
      type: "extracted",
      paragraphId: "d:0",
      field: "destinatario:x1:cargo",
      start: 33,
      end: 45,
    };

    const splits = generateSplits(paragraph, [tag, search, extracted]);

    expect(splits).toEqual([
      { type: "text", start: 0, end: 16 },
      { ...tag },
      { type: "text", start: 25, end: 27 },
      { ...search },
      { type: "text", start: 32, end: 33 },
      { ...extracted },
    ]);
  });

  it("drops an extracted token that overlaps a tag, leaving the tag intact (N1: search/tag take precedence over extracted)", () => {
    const tag: Annotation = {
      type: "tag",
      paragraphId: "d:0",
      tag: "PER_NOMBRE" as AllLabels,
      start: 16,
      end: 25,
    };
    const extracted: Annotation = {
      type: "extracted",
      paragraphId: "d:0",
      field: "destinatario:x1:nombre",
      start: 10,
      end: 20,
    };

    const splits = generateSplits(paragraph, [tag, extracted]);

    expect(splits).toEqual([
      { type: "text", start: 0, end: 16 },
      { ...tag },
      { type: "text", start: 25, end: paragraph.length },
    ]);
  });

  it("drops an extracted token that overlaps a search, leaving the search intact (N1)", () => {
    const search: Annotation = {
      type: "search",
      paragraphId: "d:0",
      start: 16,
      end: 25,
      searchMatchId: "match-1",
      searchIndex: 0,
      isActive: false,
    };
    const extracted: Annotation = {
      type: "extracted",
      paragraphId: "d:0",
      field: "destinatario:x1:nombre",
      start: 10,
      end: 20,
    };

    const splits = generateSplits(paragraph, [search, extracted]);

    expect(splits).toEqual([
      { type: "text", start: 0, end: 16 },
      { ...search },
      { type: "text", start: 25, end: paragraph.length },
    ]);
  });
});
