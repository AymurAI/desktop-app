import { describe, expect, it } from "vitest";
import { formatTime } from "./format-time";

describe("formatTime", () => {
  it.each([
    [0, "00:00"],
    [3_599_000, "59:59"],
    [3_600_000, "1:00:00"],
    [90_000_000, "25:00:00"],
    [442_800_000, "123:00:00"],
  ])("formats %i milliseconds as %s", (milliseconds, expected) => {
    expect(formatTime(milliseconds)).toBe(expected);
  });
});
