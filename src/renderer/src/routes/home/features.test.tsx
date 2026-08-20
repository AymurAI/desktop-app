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

    const link = screen.getByText("summarizer:title").closest("a");
    expect(link).toHaveAttribute("href", expect.stringContaining("SUMMARIZER"));
  });

  it("sizes the outer Stack with viewport-safe units, not 100vw/100vh", () => {
    const RouteComponent = Route.options.component as React.FC;
    const { container } = render(<RouteComponent />);

    const stack = container.firstElementChild;
    expect(stack?.className).toContain("w_full");
    expect(stack?.className).toContain("h_[100dvh]");
    expect(stack?.className).not.toContain("w_screen");
    expect(stack?.className).not.toContain("h_screen");
  });
});
