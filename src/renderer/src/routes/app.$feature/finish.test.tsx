import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { Route } from "./finish";

vi.mock("@/hooks", () => ({ useFileDispatch: () => vi.fn() }));
vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-router")>()),
  useNavigate: () => vi.fn(),
  useParams: () => ({ feature: "ANONYMIZER" }),
  createFileRoute: () => (options: unknown) => ({ options }),
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("@/features/RequireFile", () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock("@/components/layout/header", () => ({
  default: ({ currentStep }: { currentStep?: number }) => (
    <div data-testid="header-step">{currentStep ?? "none"}</div>
  ),
}));
vi.mock("@/components/finish/finish-anonymizer", () => ({
  default: () => null,
}));
vi.mock("@/components/finish/finish-dataset", () => ({
  default: () => null,
}));
vi.mock("@/components/voice-to-text/finish", () => ({
  default: () => null,
}));

describe("Finish route", () => {
  it("shows step 4 for Anonimizador, matching Dataset", () => {
    const RouteComponent = Route.options.component;
    if (!RouteComponent) throw new Error("Finish route has no component");

    render(<RouteComponent />);

    expect(screen.getByTestId("header-step")).toHaveTextContent("4");
  });
});
