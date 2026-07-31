import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SearchBar } from ".";

vi.mock("@/store/useLocal", () => ({
  useExcludedTagsConfig: () => ({ tags: null }),
}));

vi.mock("@/utils/anonymizer/labels", () => ({
  getActiveAnonymizerLabelOptions: () => [],
}));

// G3 (tasks/responsive-fixes/issues/G3-toolbar-y-cierre-panel.md), issue 05:
// the search/label-controls strings now come from i18next (constants/i18n/
// locales/es/anonymizer.ts's `searchBar` key), same convention as
// label-manager/index.test.tsx's mock for issue 06's close button.
vi.mock("react-i18next", () => ({
  useTranslation: (namespace?: string) => ({
    t: (key: string) => `${namespace ?? "common"}:${key}`,
  }),
}));

describe("document SearchBar", () => {
  it("uses Toolbar search controls without losing navigation or clearing", () => {
    const onSearchChange = vi.fn();
    const onNext = vi.fn();
    const onPrevious = vi.fn();
    const onFocusDocument = vi.fn();

    render(
      <SearchBar
        isLabelManagerOpen={false}
        onLabelManagerToggle={vi.fn()}
        matchesCount={4}
        activeIndex={1}
        onNext={onNext}
        onPrevious={onPrevious}
        onFocusDocument={onFocusDocument}
        onSearchChange={onSearchChange}
      />,
    );

    const search = screen.getByRole("searchbox", {
      name: "anonymizer:searchBar.searchAriaLabel",
    });
    fireEvent.change(search, { target: { value: "dato" } });

    expect(onSearchChange).toHaveBeenLastCalledWith("dato");
    expect(screen.getByText("2 de 4")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Coincidencia anterior" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Coincidencia siguiente" }),
    );
    expect(onPrevious).toHaveBeenCalledOnce();
    expect(onNext).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole("button", { name: "Limpiar búsqueda" }));
    expect(onSearchChange).toHaveBeenLastCalledWith("");
    expect(onFocusDocument).toHaveBeenCalledOnce();

    fireEvent.change(search, { target: { value: "otro" } });
    fireEvent.keyDown(search, { key: "Escape" });
    expect(onSearchChange).toHaveBeenLastCalledWith("");
    expect(onFocusDocument).toHaveBeenCalledTimes(2);
  });

  // G3 (tasks/responsive-fixes/issues/G3-toolbar-y-cierre-panel.md), issue 05:
  // "Aplicar etiquetas" must be a single text node with no embedded newline -
  // the CT spec (playwright/anon-toolbar.spec.tsx) checks the rendered line
  // count across widths, but that only means something if the source text
  // itself has no hard break to begin with.
  it("renders the label controls group with a single-line label when isAnnotable", () => {
    render(
      <SearchBar
        isAnnotable
        isLabelManagerOpen={false}
        onLabelManagerToggle={vi.fn()}
        matchesCount={0}
        activeIndex={null}
        onNext={vi.fn()}
        onPrevious={vi.fn()}
        onFocusDocument={vi.fn()}
      />,
    );

    const label = screen.getByText("anonymizer:searchBar.applyLabels");
    expect(label.textContent).toBe("anonymizer:searchBar.applyLabels");
    expect(label.textContent).not.toContain("\n");
  });

  it("does not render the label controls group when isAnnotable is false", () => {
    render(
      <SearchBar
        isAnnotable={false}
        isLabelManagerOpen={false}
        onLabelManagerToggle={vi.fn()}
        matchesCount={0}
        activeIndex={null}
        onNext={vi.fn()}
        onPrevious={vi.fn()}
        onFocusDocument={vi.fn()}
      />,
    );

    expect(
      screen.queryByText("anonymizer:searchBar.applyLabels"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "anonymizer:searchBar.manageLabels",
      }),
    ).not.toBeInTheDocument();
  });

  it("hides the 'Gestor de etiquetas' button while the label manager is open", () => {
    render(
      <SearchBar
        isAnnotable
        isLabelManagerOpen={true}
        onLabelManagerToggle={vi.fn()}
        matchesCount={0}
        activeIndex={null}
        onNext={vi.fn()}
        onPrevious={vi.fn()}
        onFocusDocument={vi.fn()}
      />,
    );

    expect(
      screen.getByText("anonymizer:searchBar.applyLabels"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "anonymizer:searchBar.manageLabels",
      }),
    ).not.toBeInTheDocument();
  });
});
