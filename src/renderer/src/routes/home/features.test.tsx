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
  Link: ({
    to,
    params = {},
    children,
    ...props
  }: {
    to: string;
    params?: Record<string, string>;
    children: React.ReactNode;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    // Simple template substitution: /app/$feature + { feature: "SUMMARIZER" } => /app/SUMMARIZER
    let href = to;
    if (params && to.includes("$")) {
      Object.entries(params).forEach(([key, value]) => {
        href = href.replace(`$${key}`, String(value));
      });
    }
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  },
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
