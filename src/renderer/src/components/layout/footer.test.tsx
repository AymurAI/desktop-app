import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import Footer from "./footer";

vi.mock("@aymurai/ui", () => ({
  AppFooter: ({
    leading,
    actions,
  }: {
    leading?: ReactNode;
    actions?: ReactNode;
  }) => (
    <footer data-testid="app-footer">
      <div data-testid="leading-slot">{leading}</div>
      <div data-testid="actions-slot">{actions}</div>
    </footer>
  ),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe("Footer", () => {
  it("adapts BuiltBy and children to AppFooter's slots", () => {
    render(<Footer withBuiltBy>Actions here</Footer>);

    expect(screen.getByTestId("app-footer")).toBeInTheDocument();
    expect(screen.getByTestId("leading-slot")).toHaveTextContent(
      "platformBuiltBy",
    );
    expect(screen.getByTestId("actions-slot")).toHaveTextContent(
      "Actions here",
    );
  });

  it("omits BuiltBy when withBuiltBy is not set", () => {
    render(<Footer>Actions here</Footer>);

    expect(screen.getByTestId("leading-slot")).toBeEmptyDOMElement();
  });
});
