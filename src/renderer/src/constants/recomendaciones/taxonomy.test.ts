import { describe, expect, it } from "vitest";
import { TAXONOMY, TEMA_OPTIONS, subtemaOptions } from "./taxonomy";

describe("taxonomy", () => {
  it("exposes every tema as a select option", () => {
    expect(TEMA_OPTIONS).toHaveLength(Object.keys(TAXONOMY).length);
    expect(TEMA_OPTIONS.every((o) => o.id === o.text)).toBe(true);
  });

  it("returns the subtemas of a known tema", () => {
    expect(subtemaOptions("AMBIENTE y CAMBIO CLIMÁTICO")).toContainEqual({
      id: "Inundaciones",
      text: "Inundaciones",
    });
  });

  it("returns an empty list for an unknown tema", () => {
    expect(subtemaOptions("NO EXISTE")).toEqual([]);
  });

  it("has no tema with an empty subtema list", () => {
    for (const [tema, subtemas] of Object.entries(TAXONOMY)) {
      expect(subtemas.length, tema).toBeGreaterThan(0);
    }
  });
});
