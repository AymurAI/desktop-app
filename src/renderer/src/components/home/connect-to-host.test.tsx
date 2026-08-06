import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import ConnectToHost from "./connect-to-host";

vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-router")>()),
  useNavigate: () => vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mutate = vi.fn();
let mockedError: Error | null = null;
vi.mock("@/services/aymurai", () => ({
  useConnectToHost: () => ({
    mutate,
    isPending: false,
    get error() {
      return mockedError;
    },
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

  it("renders the AymurAI brand logo above the form", () => {
    vi.stubEnv("VITE_APP_MODE", "web");

    render(<ConnectToHost />);

    expect(screen.getByAltText("Logotipo AymurAI")).toBeInTheDocument();
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

describe("ConnectToHost — error logging", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    mutate.mockReset();
    mockedError = null;
  });

  it("logs the failure once via the mutation's onError, when the attempt actually fails", () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const failure = new Error("connection failed");
    mutate.mockImplementation(
      (_host: string, options?: { onError?: (err: Error) => void }) => {
        options?.onError?.(failure);
      },
    );

    render(<ConnectToHost />);
    fireEvent.click(
      screen.getByRole("button", { name: "home.host.connectServerSubmit" }),
    );

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(failure);
  });

  it("does not log on render, even across repeated re-renders while an error is displayed", () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mockedError = new Error("connection failed");

    const { rerender } = render(<ConnectToHost />);
    rerender(<ConnectToHost />);
    rerender(<ConnectToHost />);

    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
