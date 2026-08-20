import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Route } from "./index";

const navigate = vi.fn();
vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-router")>()),
  useNavigate: () => navigate,
  createFileRoute: () => (options: unknown) => ({ options }),
}));

describe("Landing page initial redirect", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    navigate.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("redirects straight to /home/features when running as the web app", () => {
    vi.stubEnv("VITE_APP_MODE", "web");
    const RouteComponent = Route.options.component;
    if (!RouteComponent) throw new Error("Index route has no component");

    render(<RouteComponent />);
    vi.advanceTimersByTime(2000);

    expect(navigate).toHaveBeenCalledWith({ to: "/home/features" });
  });

  it("redirects to /home (host setup) when running as the desktop app", () => {
    vi.stubEnv("VITE_APP_MODE", "electron");
    const RouteComponent = Route.options.component;
    if (!RouteComponent) throw new Error("Index route has no component");

    render(<RouteComponent />);
    vi.advanceTimersByTime(2000);

    expect(navigate).toHaveBeenCalledWith({ to: "/home" });
  });
});
