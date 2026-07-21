import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { Route } from "./validation";

vi.mock("@/hooks", () => ({
  useFiles: () => [{ data: new File(["x"], "a.docx") }],
}));
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
vi.mock("@/components", () => ({
  FileAnnotator: () => null,
  ValidateDataset: () => null,
}));
vi.mock("@/components/layout/header", () => ({ default: () => null }));
vi.mock("@/components/layout/footer", () => ({
  default: ({
    children,
    withBuiltBy,
  }: {
    children: ReactNode;
    withBuiltBy?: boolean;
  }) => (
    <footer data-testid="footer" data-built-by={String(withBuiltBy)}>
      {children}
    </footer>
  ),
}));
vi.mock("@/components/voice-to-text/validation", () => ({
  default: () => null,
}));

describe("Anonimizador validation footer", () => {
  it("requests the DataGénero credit", () => {
    const RouteComponent = Route.options.component;
    if (!RouteComponent) throw new Error("Validation route has no component");

    render(<RouteComponent />);

    expect(screen.getByTestId("footer")).toHaveAttribute(
      "data-built-by",
      "true",
    );
  });
});
