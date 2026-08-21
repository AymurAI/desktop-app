import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import LabelManager from "./index";

// LabelManager itself only needs `useFileDispatch` (`@/hooks`), but its
// heavy children (LabelEntityTab: useFiles/useEntityGroups/useHoverState/
// AnonymizerLabelSelect, and dnd-kit) render for real unless stubbed too -
// following components/validate-dataset/index.test.tsx's precedent.
// Stubbing both tabs is deliberate: it keeps this test on the header, which
// is what G3 issue 06's criteria 3/4 are actually about.
vi.mock("@/hooks", () => ({
  useFileDispatch: () => vi.fn(),
}));
vi.mock("./entity-tab", () => ({
  default: () => <div data-testid="entity-tab-stub" />,
}));
vi.mock("./config-tab", () => ({
  default: () => <div data-testid="config-tab-stub" />,
}));

vi.mock("react-i18next", () => ({
  useTranslation: (namespace?: string) => ({
    t: (key: string) => `${namespace ?? "common"}:${key}`,
  }),
}));

describe("LabelManager close button (G3 issue 06)", () => {
  it("exposes the translated aria-label and no longer renders a literal X glyph", () => {
    render(<LabelManager onClose={vi.fn()} />);

    const closeButton = screen.getByRole("button", {
      name: "anonymizer:labelManager.closeAria",
    });
    expect(closeButton).toBeInTheDocument();
    expect(closeButton).not.toHaveTextContent("X");
  });

  it("calls onClose exactly once when clicked", () => {
    const onClose = vi.fn();
    render(<LabelManager onClose={onClose} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "anonymizer:labelManager.closeAria",
      }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("LabelManager tab switching (sad path)", () => {
  it("switches from the entity tab to the config tab without breaking", () => {
    render(<LabelManager onClose={vi.fn()} />);

    expect(screen.getByTestId("entity-tab-stub")).toBeInTheDocument();
    expect(screen.queryByTestId("config-tab-stub")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Configuración"));

    expect(screen.getByTestId("config-tab-stub")).toBeInTheDocument();
    expect(screen.queryByTestId("entity-tab-stub")).not.toBeInTheDocument();
  });
});
