import { afterEach, describe, expect, it, vi } from "vitest";

import { isElectronApp, isWebApp } from "./app-mode";

describe("app-mode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reports electron mode when VITE_APP_MODE is 'electron'", () => {
    vi.stubEnv("VITE_APP_MODE", "electron");

    expect(isElectronApp()).toBe(true);
    expect(isWebApp()).toBe(false);
  });

  it("reports web mode when VITE_APP_MODE is 'web'", () => {
    vi.stubEnv("VITE_APP_MODE", "web");

    expect(isElectronApp()).toBe(false);
    expect(isWebApp()).toBe(true);
  });
});
