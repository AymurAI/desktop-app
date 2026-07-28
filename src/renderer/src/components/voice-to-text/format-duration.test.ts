import { describe, expect, it } from "vitest";
import { formatDuration } from "./use-audio-snippet";

describe("formatDuration", () => {
  it("formats minutes and seconds", () => {
    expect(formatDuration(46 * 60_000 + 34_000)).toBe("46 min. 34 seg.");
  });

  it("formats sub-minute durations as seconds only", () => {
    expect(formatDuration(9_000)).toBe("9 seg.");
  });

  it("adds hours once past 60 minutes, keeping minutes and seconds", () => {
    // 125 min 24 seg = 2 h 5 min 24 seg
    expect(formatDuration(125 * 60_000 + 24_000)).toBe("2 hs. 5 min. 24 seg.");
  });

  it("uses the singular 'h.' for exactly one hour", () => {
    expect(formatDuration(60 * 60_000 + 3_000)).toBe("1 h. 0 min. 3 seg.");
  });

  it("treats 0 / NaN as 0 seconds", () => {
    expect(formatDuration(0)).toBe("0 seg.");
    expect(formatDuration(Number.NaN)).toBe("0 seg.");
  });
});
