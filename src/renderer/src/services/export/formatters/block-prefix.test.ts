import { describe, expect, it } from "vitest";
import { blockPrefix } from "./block-prefix";

describe("blockPrefix", () => {
  it("joins timestamp and speaker, ending with a colon, when both are present", () => {
    expect(
      blockPrefix({ timestamp: "00:36", speaker: "Persona 1", text: "" }),
    ).toBe("[00:36] Persona 1:");
  });

  it("keeps the colon after the timestamp when the speaker is omitted", () => {
    expect(blockPrefix({ timestamp: "00:36", text: "" })).toBe("[00:36]:");
  });

  it("keeps the colon after the speaker when the timestamp is omitted", () => {
    expect(blockPrefix({ speaker: "Persona 1", text: "" })).toBe("Persona 1:");
  });

  it("returns an empty prefix (no colon) when neither is present", () => {
    expect(blockPrefix({ text: "" })).toBe("");
  });
});
