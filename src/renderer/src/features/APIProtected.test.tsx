import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// api.ts sets api.defaults.baseURL from the page's own origin at module-load
// time when running as the web app (see services/api.ts). APIProtected
// redirects to "/" whenever that baseURL is unset. These two behaviors only
// work correctly together if a web-mode boot with no saved host does NOT
// bounce back to "/". Because the baseURL bootstrap is a module-load-time
// side effect, we must vi.resetModules() and dynamically re-import both
// modules per test (mirroring services/api.test.ts) — otherwise Vitest's
// module cache would make a stubbed env from an earlier test stick.
describe("APIProtected — interaction with api.ts's web-mode baseURL bootstrap", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.doUnmock("@/store/useLocal");
    vi.doUnmock("@tanstack/react-router");
  });

  it("does not redirect to / on a web boot with no saved host", async () => {
    vi.stubEnv("VITE_APP_MODE", "web");
    vi.doMock("@/store/useLocal", () => ({ getServerHost: () => null }));
    vi.doMock("@tanstack/react-router", () => ({
      Navigate: () => <div data-testid="redirected-home" />,
    }));

    await import("@/services/api");
    const { default: APIProtected } = await import("@/features/APIProtected");

    render(
      <APIProtected>
        <div data-testid="protected-content" />
      </APIProtected>,
    );

    expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    expect(screen.queryByTestId("redirected-home")).not.toBeInTheDocument();
  });

  it("redirects to / on a desktop boot with no saved host", async () => {
    vi.stubEnv("VITE_APP_MODE", "electron");
    vi.doMock("@/store/useLocal", () => ({ getServerHost: () => null }));
    vi.doMock("@tanstack/react-router", () => ({
      Navigate: () => <div data-testid="redirected-home" />,
    }));

    await import("@/services/api");
    const { default: APIProtected } = await import("@/features/APIProtected");

    render(
      <APIProtected>
        <div data-testid="protected-content" />
      </APIProtected>,
    );

    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
    expect(screen.getByTestId("redirected-home")).toBeInTheDocument();
  });
});
