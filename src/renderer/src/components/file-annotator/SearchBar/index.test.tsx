import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SearchBar } from ".";

vi.mock("@/store/useLocal", () => ({
  useExcludedTagsConfig: () => ({ tags: null }),
}));

vi.mock("@/utils/anonymizer/labels", () => ({
  getActiveAnonymizerLabelOptions: () => [],
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
      name: "Buscar en el documento",
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
});
