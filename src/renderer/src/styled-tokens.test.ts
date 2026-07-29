import { css } from "@/styled/css";
import { describe, expect, it } from "vitest";

describe("RSP-01 layout size tokens", () => {
  it("type-checks content.max and panel.side without a [bracket] escape", () => {
    const className = css({
      maxWidth: "content.max",
      width: "panel.side",
    });

    expect(typeof className).toBe("string");
    expect(className.length).toBeGreaterThan(0);
  });
});
