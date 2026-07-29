import { describe, expect, it } from "vitest";
import { select } from "./anonymizer-label-select";

describe("anonymizer-label-select recipe (RSP-07b)", () => {
  it("relaxes the dropdown viewport's cap so it can shrink on short viewports", () => {
    const classes = select().viewport;

    expect(classes).toContain("max-h_[min(360px,_60dvh)]");
    expect(classes).not.toContain("max-h_[360px]");
  });
});
