import { describe, expect, it } from "vitest";
import { routerOptions } from "./app";

describe("App router options", () => {
  it("does not enable TanStack's default view transition", () => {
    expect(routerOptions).not.toHaveProperty("defaultViewTransition");
    expect("defaultViewTransition" in routerOptions).toBe(false);
  });
});
