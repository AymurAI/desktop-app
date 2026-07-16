import { describe, expect, it } from "vitest";
import { parseTimestampToMs } from "./parse-timestamp";

describe("parseTimestampToMs", () => {
  it("parses MM:SS below one hour", () => {
    expect(parseTimestampToMs("00:00")).toBe(0);
    expect(parseTimestampToMs("59:59")).toBe(3_599_000);
    expect(parseTimestampToMs("01:05")).toBe(65 * 1000);
  });
  it("parses H+:MM:SS including multi-digit and three-digit hours", () => {
    expect(parseTimestampToMs("1:00:00")).toBe(3_600_000);
    expect(parseTimestampToMs("25:00:00")).toBe(90_000_000);
    expect(parseTimestampToMs("123:00:00")).toBe(442_800_000);
  });
  it("rejects out-of-range seconds/minutes and garbage", () => {
    expect(parseTimestampToMs("65:00")).toBeNull();
    expect(parseTimestampToMs("75:33")).toBeNull();
    expect(parseTimestampToMs("01:60")).toBeNull();
    expect(parseTimestampToMs("01:60:00")).toBeNull();
    expect(parseTimestampToMs("abc")).toBeNull();
    expect(parseTimestampToMs("")).toBeNull();
  });
});
