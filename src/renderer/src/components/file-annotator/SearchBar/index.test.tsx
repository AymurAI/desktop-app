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
    // The mocked `t()` (see the module mock above) doesn't interpolate -
    // it returns the raw key regardless of the options object, same as
    // every other mocked call in this file.
    expect(
      screen.getByText("anonymizer:searchBar.matchCount"),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "anonymizer:searchBar.previousMatch",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "anonymizer:searchBar.nextMatch" }),
    );
    expect(onPrevious).toHaveBeenCalledOnce();
    expect(onNext).toHaveBeenCalledOnce();

    fireEvent.click(
      screen.getByRole("button", { name: "anonymizer:searchBar.clearSearch" }),
    );
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

  // G10 (tasks/responsive-fixes/issues/G10-toolbar-wrap-1024.md) is measured
  // with `getBoundingClientRect()` in playwright/anon-toolbar.spec.tsx, and
  // only `pnpm test:responsive` runs that file: neither declared gate
  // (`pnpm validate`, `pnpm test`) executes it, and no CI config or lefthook
  // hook does either, so nothing stops the fix from being reverted green.
  // jsdom performs no layout, but the two style facts the fix rests on are
  // class names - checkable here, same precedent as
  // global-styles-tokens.test.ts, which exists because measured values were
  // "unguarded by the deterministic gates".
  it("keeps the label controls group a direct child of the Toolbar root (G3's prop swap)", () => {
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

    const group = screen.getByText(
      "anonymizer:searchBar.applyLabels",
    ).parentElement;

    // Not decoration: as `Toolbar`'s `children` the group is a direct flex
    // item of a `justifyContent: "space-between"` root, which is what makes
    // it start at the LEFT of the second row once it wraps there alone.
    // Reverting to `rightSlot` would re-nest it inside the library's own
    // wrapper - the one carrying `ml: "auto"` and the orphaned divider - and
    // would also make the assertion below inspect the wrong element.
    expect(group?.parentElement).toBe(
      screen.getByTestId("anon-toolbar").firstElementChild,
    );
  });

  it("does not push the label controls group with an auto left margin", () => {
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

    const group = screen.getByText(
      "anonymizer:searchBar.applyLabels",
    ).parentElement;

    // `ml: "auto"` is inert on a shared row (the search wrapper is `flex: 1`
    // and already absorbs the free space) and actively wrong on a wrapped
    // row, where it drags the group to the far right of an otherwise empty
    // row - G10's "two unrelated blocks" symptom. The CT spec's
    // `getComputedStyle(...).marginLeft === 0` check cannot catch a revert on
    // its own: on a shared row an auto margin resolves to 0px too.
    expect(group?.className).not.toContain("ml_auto");
    expect(group?.className).toContain("jc_flex-start");
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
