import { describe, expect, it } from "vitest";
import { apportionTimeRange } from "./apportion-time-range";

describe("apportionTimeRange", () => {
  it("maps character offsets proportionally onto the time range", () => {
    // 16 chars over 4000ms -> 250ms/char
    const [at5, at10] = apportionTimeRange(1000, 5000, 16, [5, 10]);
    expect(at5).toBe(1000 + 5 * 250);
    expect(at10).toBe(1000 + 10 * 250);
  });

  it("returns startMs and endMs for offsets 0 and totalLen", () => {
    const [start, end] = apportionTimeRange(1000, 5000, 16, [0, 16]);
    expect(start).toBe(1000);
    expect(end).toBe(5000);
  });

  it("clamps offsets outside [0, totalLen]", () => {
    const [under, over] = apportionTimeRange(1000, 5000, 16, [-5, 100]);
    expect(under).toBe(1000);
    expect(over).toBe(5000);
  });

  it("falls back to startMs for every offset when totalLen is 0", () => {
    const result = apportionTimeRange(1000, 5000, 0, [0, 5, 16]);
    expect(result).toEqual([1000, 1000, 1000]);
  });

  it("returns startMs for every offset when the range has zero duration", () => {
    const result = apportionTimeRange(2000, 2000, 16, [0, 5, 16]);
    expect(result).toEqual([2000, 2000, 2000]);
  });
});
