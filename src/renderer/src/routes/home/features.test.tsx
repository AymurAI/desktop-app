import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Route } from "./features";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: unknown) => ({
    options: opts,
  }),
  Link: ({ children, ...props }: React.ComponentProps<"a">) => (
    <a {...props}>{children}</a>
  ),
  Navigate: () => null,
  useNavigate: () => vi.fn(),
}));

vi.mock("@/services/api", () => ({
  default: {
    defaults: {
      baseURL: "http://localhost:3000",
    },
  },
}));

describe("home/features — Summarizer card", () => {
  it("renders the Summarizer card as an enabled link to /app/SUMMARIZER", () => {
    const RouteComponent = Route.options.component as React.FC;
    render(<RouteComponent />);

    const link = screen.getByText("home.features.summaryTitle").closest("a");
    expect(link).toHaveAttribute("href", expect.stringContaining("SUMMARIZER"));
  });
});
