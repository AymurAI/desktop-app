import { describe, expect, it } from "vitest";
import { clampMenuPosition } from "./entity-tab";

describe("clampMenuPosition", () => {
  it("leaves the position unchanged when the menu already fits", () => {
    const result = clampMenuPosition(
      { x: 100, y: 100 },
      { width: 150, height: 80 },
      { width: 768, height: 1024 },
    );

    expect(result).toEqual({ x: 100, y: 100 });
  });

  it("pulls the menu back from the right edge at a 768-wide viewport", () => {
    // A right-click near the right edge of a 768 viewport, where the
    // entities panel overlays most of the width (RSP-07b).
    const result = clampMenuPosition(
      { x: 750, y: 100 },
      { width: 150, height: 80 },
      { width: 768, height: 1024 },
    );

    expect(result.x).toBe(768 - 150 - 8);
    expect(result.y).toBe(100);
  });

  it("pulls the menu back from the bottom edge", () => {
    const result = clampMenuPosition(
      { x: 100, y: 1000 },
      { width: 150, height: 80 },
      { width: 768, height: 1024 },
    );

    expect(result.y).toBe(1024 - 80 - 8);
  });

  it("never produces a position closer than `margin` to the origin even if the menu is larger than the viewport", () => {
    const result = clampMenuPosition(
      { x: 50, y: 50 },
      { width: 900, height: 1200 },
      { width: 768, height: 1024 },
    );

    expect(result).toEqual({ x: 8, y: 8 });
  });
});
