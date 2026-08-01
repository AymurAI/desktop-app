import { describe, expect, it } from "vitest";

import NotFound from "@/components/layout/not-found";
import { Route } from "./__root";

describe("root route", () => {
  it("registers the themed notFoundComponent on the root route", () => {
    expect(Route.options.component).toBeDefined();
    expect(Route.options.notFoundComponent).toBe(NotFound);
    expect(Route.options).not.toHaveProperty("notFoundRoute");
  });
});
