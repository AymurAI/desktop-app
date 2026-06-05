import { describe, expect, it } from "vitest";
import { formatDuration } from "./use-audio-snippet";

describe("formatDuration", () => {
  it("formats minutes and seconds", () => {
    expect(formatDuration(46 * 60_000 + 34_000)).toBe("46 min. 34 seg.");
  });

  it("formats sub-minute durations as seconds only", () => {
    expect(formatDuration(9_000)).toBe("9 seg.");
  });

  it("treats 0 / NaN as 0 seconds", () => {
    expect(formatDuration(0)).toBe("0 seg.");
    expect(formatDuration(Number.NaN)).toBe("0 seg.");
  });
});
