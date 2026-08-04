import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("api — initial baseURL", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.doUnmock("@/store/useLocal");
  });

  it("defaults to the page's own origin in the web app when no host is saved", async () => {
    vi.stubEnv("VITE_APP_MODE", "web");
    vi.doMock("@/store/useLocal", () => ({ getServerHost: () => null }));

    const { default: api } = await import("./api");

    expect(api.defaults.baseURL).toBe(window.location.origin);
  });

  it("prefers a previously saved server host over the page origin in the web app", async () => {
    vi.stubEnv("VITE_APP_MODE", "web");
    vi.doMock("@/store/useLocal", () => ({
      getServerHost: () => "https://custom.example.com",
    }));

    const { default: api } = await import("./api");

    expect(api.defaults.baseURL).toBe("https://custom.example.com");
  });

  it("leaves baseURL unset in the desktop app", async () => {
    vi.stubEnv("VITE_APP_MODE", "electron");
    vi.doMock("@/store/useLocal", () => ({ getServerHost: () => null }));

    const { default: api } = await import("./api");

    expect(api.defaults.baseURL).toBeUndefined();
  });
});
