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

  it("falls back to a single best fuzzy match above the threshold", () => {
    const matches = locateValue(
      "Directora General de Fiscalizacion Urbanaa",
      paragraphs,
    );
    expect(matches).toHaveLength(1);
    expect(matches[0].exact).toBe(false);
    expect(matches[0].score).toBeGreaterThanOrEqual(0.9);
    expect(matches[0].paragraphId).toBe("d:1");
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
});
