import { render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import NotFound from "./not-found";

vi.mock("react-i18next", () => ({
  useTranslation: (namespace?: string) => ({
    t: (key: string) => `${namespace ?? "common"}:${key}`,
  }),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    children,
    ...props
  }: {
    to: string;
    children: ReactNode;
  } & AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/store/useLocal", () => ({
  useTutorialSeen: () => false,
}));

vi.mock("../features-menu", () => ({
  default: ({ trigger }: { trigger: ReactNode }) => (
    <div data-testid="apps-trigger">{trigger}</div>
  ),
}));

describe("NotFound", () => {
  it("renders themed 404 copy from common i18n without the raw router fallback string", () => {
    render(<NotFound />);

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByText("common:notFound.title")).toBeInTheDocument();
    expect(screen.getByText("common:notFound.description")).toBeInTheDocument();
    expect(screen.queryByText("Not Found")).not.toBeInTheDocument();
  });

  it("renders a visible real anchor back to the features screen", () => {
    render(<NotFound />);

    const link = screen.getByRole("link", {
      name: "common:notFound.linkLabel",
    });
    expect(link).toBeVisible();
    expect(link).toHaveAttribute("href", "/home/features");
  });

  it("mounts without feature props or feature router context", () => {
    expect(() => render(<NotFound />)).not.toThrow();
  });

  it("horizontally contains the header actions on narrow unknown routes", () => {
    render(<NotFound />);

    const header = screen.getByRole("banner");
    expect(header.className).toContain("w_full");
    expect(header.className).toContain("min-w_0");
    expect(header.className).toContain("ov-x_hidden");
  });
});
