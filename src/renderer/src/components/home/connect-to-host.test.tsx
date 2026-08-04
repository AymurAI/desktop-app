import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import ConnectToHost from "./connect-to-host";

vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-router")>()),
  useNavigate: () => vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("@/services/aymurai", () => ({
  useConnectToHost: () => ({
    mutate: vi.fn(),
    isPending: false,
    error: null,
    reset: vi.fn(),
  }),
}));

vi.mock("@/store/useLocal", () => ({
  useServerHost: () => null,
  useServerHostActions: () => ({ setServerHost: vi.fn() }),
}));

describe("ConnectToHost — default server address", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("prefills the field with the web app's own origin when no host is saved yet", () => {
    vi.stubEnv("VITE_APP_MODE", "web");

    render(<ConnectToHost />);

    expect(screen.getByRole("textbox")).toHaveValue(window.location.origin);
  });

  it("leaves the field empty on desktop when no host is saved yet", () => {
    vi.stubEnv("VITE_APP_MODE", "electron");

    render(<ConnectToHost />);

    expect(screen.getByRole("textbox")).toHaveValue("");
  });
});
