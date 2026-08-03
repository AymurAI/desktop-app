import type { Paragraph } from "@/types/file";
import { describe, expect, it } from "vitest";
import { locateValue, normalizeForMatch } from "./locate-value";

const p = (id: string, value: string): Paragraph => ({
  id,
  value,
  document_id: "d",
});

describe("normalizeForMatch", () => {
  it("lowercases, strips diacritics and collapses whitespace", () => {
    const { normalized } = normalizeForMatch("  Fiscalización   Urbana ");
    expect(normalized).toBe(" fiscalizacion urbana ");
  });

  it("maps normalized indices back to original ones", () => {
    const { normalized, map } = normalizeForMatch("Añó   X");
    const i = normalized.indexOf("x");
    expect("Añó   X".slice(map[i], map[i] + 1)).toBe("X");
  });

  it("appends a sentinel equal to the original length, so `end` at the string's tail resolves", () => {
    const text = "abc";
    const { normalized, map } = normalizeForMatch(text);
    expect(normalized).toBe("abc");
    expect(map).toHaveLength(text.length + 1);
    expect(map[map.length - 1]).toBe(text.length);
  });

  it("folds a lone combining mark to zero characters (not pushed into the map)", () => {
    // U+0301 COMBINING ACUTE ACCENT standing alone (already-decomposed,
    // malformed input) normalizes+strips to the empty string.
    const text = "áb";
    const { normalized, map } = normalizeForMatch(text);
    expect(normalized).toBe("ab");
    // Only 'a' (index 0) and 'b' (index 2) contribute, plus the sentinel.
    expect(map).toEqual([0, 2, 3]);
  });

  it("folds a single character into more than one normalized character", () => {
    // U+AC00 (Hangul syllable "가") canonically decomposes under NFD into
    // two Jamo code points, neither of which is a combining mark, so both
    // survive the \p{Mn} strip: one raw character maps to two normalized ones.
    const text = "가b";
    const { normalized, map } = normalizeForMatch(text);
    expect(normalized).toHaveLength(3);
    expect(map).toEqual([0, 0, 1, 2]);
  });
});

describe("locateValue", () => {
  const paragraphs = [
    p("d:0", "Buenos Aires, 30 de mayo de 2022."),
    p("d:1", "Se recomienda a la Directora General de Fiscalización Urbana."),
    p("d:2", "Resolución Nro 1440/22"),
  ];

  it("finds an exact match ignoring case and accents", () => {
    const [match] = locateValue("30 de Mayo de 2022", paragraphs);
    expect(match.exact).toBe(true);
    expect(match.paragraphId).toBe("d:0");
    expect(paragraphs[0].value.slice(match.start, match.end)).toBe(
      "30 de mayo de 2022",
    );
  });

  it("returns every exact occurrence, in document order", () => {
    const repeated = [p("d:0", "1440/22"), p("d:1", "ref. 1440/22 y 1440/22")];
    const matches = locateValue("1440/22", repeated);
    expect(matches).toHaveLength(3);
    expect(matches.map((m) => m.paragraphId)).toEqual(["d:0", "d:1", "d:1"]);
  });

  it("does not report overlapping exact matches (advances past the full match)", () => {
    // "aaaa" occurs at indices 0, 1 and 2 within "aaaaaa" if the search only
    // advances by one character; it must advance by the full match length
    // so overlapping "matches" aren't reported as separate (nested /
    // duplicated) ranges a highlighter would render incorrectly.
    const matches = locateValue("aaaa", [p("z", "aaaaaa")]);
    expect(matches).toHaveLength(1);
    expect(matches[0].start).toBe(0);
    expect(matches[0].end).toBe(4);
  });

  it("falls back to a single best fuzzy match above the threshold, at the correct slice", () => {
    const matches = locateValue(
      "Directora General de Fiscalizacion Urbanaa",
      paragraphs,
    );
    expect(matches).toHaveLength(1);
    expect(matches[0].exact).toBe(false);
    expect(matches[0].paragraphId).toBe("d:1");
    // The contract: slicing the original paragraph at [start, end) must
    // yield the actual matched text, not a fragment shifted by the fuzzy
    // window's sampling stride.
    expect(paragraphs[1].value.slice(matches[0].start, matches[0].end)).toBe(
      "Directora General de Fiscalización Urbana",
    );
    // A specific, falsifiable score — not just ">= threshold", which the
    // implementation guarantees by construction for anything it returns.
    expect(matches[0].score).toBeCloseTo(0.976, 2);
  });

  it("locates a fuzzy match whose span includes an accented character, at the correct slice", () => {
    const withAccent = [p("d:0", "el requerido es el Área de Fiscalización")];
    const matches = locateValue("Area de Fiscalizacionn", withAccent);
    expect(matches).toHaveLength(1);
    expect(matches[0].exact).toBe(false);
    expect(withAccent[0].value.slice(matches[0].start, matches[0].end)).toBe(
      "Área de Fiscalización",
    );
  });

  it("picks the strictly better fuzzy candidate even when it is in a later paragraph", () => {
    const base = "a".repeat(40);
    const withOneEdit = `${base.slice(0, 15)}b${base.slice(16)}`; // 1 substitution
    const withThreeEdits = `${base.slice(0, 10)}b${base.slice(11, 20)}b${base.slice(21, 30)}b${base.slice(31)}`; // 3 substitutions
    const competing = [p("d:0", withThreeEdits), p("d:1", withOneEdit)];
    const matches = locateValue(base, competing);
    expect(matches).toHaveLength(1);
    expect(matches[0].paragraphId).toBe("d:1");
    expect(competing[1].value.slice(matches[0].start, matches[0].end)).toBe(
      withOneEdit,
    );
  });

  it("returns nothing when no candidate reaches the threshold", () => {
    expect(locateValue("Ministerio de Salud de la Nación", paragraphs)).toEqual(
      [],
    );
  });

  it("ignores values shorter than minLength", () => {
    expect(locateValue("22", paragraphs)).toEqual([]);
  });

  it("ignores empty and whitespace-only values", () => {
    expect(locateValue("   ", paragraphs)).toEqual([]);
  });

  it("does not hang on an empty value even with minLength lowered to 0", () => {
    // `"".indexOf("", pos)` clamps `pos` to the string length and never
    // returns -1, so without an explicit empty-needle guard this would loop
    // forever. `minLength` is a public option, so this must be defended
    // unconditionally rather than relying on the default of 4.
    expect(locateValue("", paragraphs, { minLength: 0 })).toEqual([]);
  });

  it("breaks fuzzy score ties by picking the first candidate in document order", () => {
    // Two paragraphs are equally (im)perfect matches for the needle; the
    // earlier one, by (paragraph order, start offset), must win.
    const tied = [p("d:0", "aaaaaaaaaa"), p("d:1", "aaaaaaaaaa")];
    const matches = locateValue("aaaaaaaaab", tied);
    expect(matches).toHaveLength(1);
    expect(matches[0].paragraphId).toBe("d:0");
    expect(matches[0].start).toBe(0);
  });

  it("does not throw and finds nothing for a value longer than every paragraph", () => {
    const short = [p("d:0", "corto")];
    expect(() =>
      locateValue("un valor mucho mas largo que el parrafo entero", short),
    ).not.toThrow();
    expect(
      locateValue("un valor mucho mas largo que el parrafo entero", short),
    ).toEqual([]);
  });

  it("truncates exact matches at maxMatches by default", () => {
    // 5 occurrences with the default maxMatches (3): distinguishes "returns
    // every occurrence" from "happens to return exactly 3", which a test
    // asserting 3 matches out of exactly 3 occurrences cannot do.
    const five = [p("d:0", "x x x x x")];
    const matches = locateValue("x", five, { minLength: 1 });
    expect(matches).toHaveLength(3);
  });

  // §F1: the coarse gate used to run at the real `threshold` on an UNREFINED
  // `step`-sampled window. A window sitting ~step/2 off the true boundary
  // loses ~2/len of similarity per misaligned character, so genuine
  // near-matches (~40% of realistic nombre/cargo values) were discarded
  // BEFORE edge refinement could recover them. The gate is now loose
  // (threshold - 0.1) with the real threshold applied to the REFINED score.
  it("(§F1) locates a 75-char cargo with one substituted character, embedded at padding offset 4", () => {
    const cargo =
      "Director General de Fiscalizacion y Control de Obras y Catastro Urbanistico";
    expect(cargo).toHaveLength(75);
    // One substitution in the middle: best achievable similarity is 74/75.
    const substituted = `${cargo.slice(0, 40)}X${cargo.slice(41)}`;
    // Padding offset 4 puts the true start out of phase with the sampling
    // stride (step = floor(75 / 8) = 9), which is exactly the case the old
    // gate dropped.
    const text = `xxxx${substituted} y otras dependencias`;

    const matches = locateValue(cargo, [p("d:0", text)]);

    expect(matches).toHaveLength(1);
    expect(matches[0].exact).toBe(false);
    expect(matches[0].score).toBeGreaterThanOrEqual(0.9);
    expect(text.slice(matches[0].start, matches[0].end)).toBe(substituted);
  });

  it("returns more matches when maxMatches is raised", () => {
    const five = [p("d:0", "x x x x x")];
    const matches = locateValue("x", five, { minLength: 1, maxMatches: 5 });
    expect(matches).toHaveLength(5);
  });
});
