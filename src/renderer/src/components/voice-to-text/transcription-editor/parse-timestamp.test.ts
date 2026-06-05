import { describe, expect, it } from "vitest";
import { parseTimestampToMs } from "./parse-timestamp";

describe("parseTimestampToMs", () => {
  it("parses mm:ss with large minutes (round-trips formatTime past 1h)", () => {
    expect(parseTimestampToMs("65:00")).toBe(65 * 60 * 1000);
    expect(parseTimestampToMs("01:05")).toBe(65 * 1000);
  });
  it("parses hh:mm:ss", () => {
    expect(parseTimestampToMs("01:05:00")).toBe((3600 + 300) * 1000);
  });
  it("rejects out-of-range seconds/minutes and garbage", () => {
    expect(parseTimestampToMs("01:60")).toBeNull();
    expect(parseTimestampToMs("01:60:00")).toBeNull();
    expect(parseTimestampToMs("abc")).toBeNull();
    expect(parseTimestampToMs("")).toBeNull();
  });
});
