import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Icon from "./Icon";

// phosphor-react's IconBase renders `color` as the SVG's `fill` attribute
// (a runtime string, not a class), so this asserts the resolved hex value
// rather than a Panda class token.
describe("Icon (RSP-08f)", () => {
  it("renders the error icon with the exact legacy error colour", () => {
    const { container } = render(<Icon hasError isLoading={false} />);
    expect(container.querySelector("svg")).toHaveAttribute("fill", "#DC582E");
  });

  it("renders the success icon with the exact legacy success colour", () => {
    const { container } = render(<Icon hasError={false} isLoading={false} />);
    expect(container.querySelector("svg")).toHaveAttribute("fill", "#3F479D");
  });

  it("renders the Spinner while loading, before checking success colour", () => {
    const { container } = render(<Icon hasError={false} isLoading />);
    expect(container.querySelector("svg")).not.toHaveAttribute(
      "fill",
      "#3F479D",
    );
  });
});
