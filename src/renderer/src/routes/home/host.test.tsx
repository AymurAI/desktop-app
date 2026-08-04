import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Route } from "./host";

vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-router")>()),
  useNavigate: () => vi.fn(),
  createFileRoute: () => (options: unknown) => ({ options }),
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

describe("/home/host — unified server screen", () => {
  it("shows the server-address form directly, with no Local/Servidor choice", () => {
    const RouteComponent = Route.options.component;
    if (!RouteComponent) throw new Error("Host route has no component");

    render(<RouteComponent />);

    expect(
      screen.getByText("home.host.connectServerExplanation"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "home.host.connectServerSubmit" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/¿Cómo deseas conectarte/),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Local")).not.toBeInTheDocument();
  });
});
