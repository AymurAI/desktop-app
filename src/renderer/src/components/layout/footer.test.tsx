import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Footer, { FOOTER_TOAST_OFFSET_VAR } from "./footer";

vi.mock("@aymurai/ui", () => ({
  AppFooter: ({
    leading,
    actions,
    ...props
  }: {
    leading?: ReactNode;
    actions?: ReactNode;
  } & React.HTMLAttributes<HTMLDivElement>) => (
    <footer data-testid="app-footer" {...props}>
      <div data-testid="leading-slot">{leading}</div>
      <div data-testid="actions-slot">{actions}</div>
    </footer>
  ),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe("Footer", () => {
  afterEach(() => {
    document.documentElement.style.removeProperty(FOOTER_TOAST_OFFSET_VAR);
    vi.restoreAllMocks();
  });

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

  it("passes HTML attributes through to AppFooter", () => {
    render(<Footer data-testid="real-footer">Actions here</Footer>);

    expect(screen.getByTestId("real-footer")).toBeInTheDocument();
  });

  it("keeps the footer toast offset while another mounted footer still owns it", () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function getBoundingClientRect(this: HTMLElement) {
        const height =
          this.getAttribute("data-testid") === "second-footer" ? 200 : 100;

        return {
          bottom: height,
          height,
          left: 0,
          right: 0,
          top: 0,
          width: 0,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        };
      },
    );

    function Footers({ showFirst }: { showFirst: boolean }) {
      return (
        <>
          {showFirst && (
            <Footer key="first" data-testid="first-footer">
              First actions
            </Footer>
          )}
          <Footer key="second" data-testid="second-footer">
            Second actions
          </Footer>
        </>
      );
    }

    const { rerender } = render(<Footers showFirst />);
    expect(
      document.documentElement.style.getPropertyValue(FOOTER_TOAST_OFFSET_VAR),
    ).toBe("200px");

    rerender(<Footers showFirst={false} />);

    expect(screen.getByTestId("second-footer")).toBeInTheDocument();
    expect(
      document.documentElement.style.getPropertyValue(FOOTER_TOAST_OFFSET_VAR),
    ).toBe("200px");
  });
});
