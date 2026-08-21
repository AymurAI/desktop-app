import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FeatureFlowEnum } from "@/types/features";
import { Route } from "./route";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: unknown) => ({ options: opts }),
  useParams: () => ({ feature: FeatureFlowEnum.Dataset }),
  Outlet: () => <div data-testid="outlet" />,
  redirect: (opts: unknown) => opts,
}));

vi.mock("@/services/api", () => ({
  default: { defaults: { baseURL: "http://localhost:3000" } },
}));

describe("app.$feature route shell", () => {
  it("sizes the outer Stack with viewport-safe units, not 100vw/100vh", () => {
    const RouteComponent = Route.options.component as React.FC;
    const { getByTestId } = render(<RouteComponent />);

    const stack = getByTestId("outlet").parentElement;
    expect(stack?.className).toContain("w_full");
    expect(stack?.className).toContain("h_[100dvh]");
    expect(stack?.className).not.toContain("w_screen");
    expect(stack?.className).not.toContain("h_screen");
  });
});
