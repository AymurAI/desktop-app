import { TooltipProvider } from "@/components/ui/tooltip";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Select from "./select";

vi.stubGlobal(
  "ResizeObserver",
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

const OPTIONS = [
  { id: "a", text: "A", description: "Description A" },
  { id: "b", text: "B" },
];

function openSelect() {
  render(
    <TooltipProvider>
      <Select options={OPTIONS} value="a" onChange={() => {}} />
    </TooltipProvider>,
  );
  fireEvent.click(screen.getByRole("combobox"));
}

describe("Select option tooltips", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not show a tooltip when the list opens, even though Radix auto-focuses the current value", () => {
    openSelect();
    expect(screen.queryByText("Description A")).toBeNull();
  });

  it("shows the option's tooltip only after a hover delay", () => {
    openSelect();
    fireEvent.pointerEnter(screen.getByRole("option", { name: "A" }));
    expect(screen.queryByText("Description A")).toBeNull();

    act(() => {
      vi.advanceTimersByTime(699);
    });
    expect(screen.queryByText("Description A")).toBeNull();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getAllByText("Description A").length).toBeGreaterThan(0);
  });

  it("cancels the pending tooltip if the pointer leaves before the delay elapses", () => {
    openSelect();
    fireEvent.pointerEnter(screen.getByRole("option", { name: "A" }));
    fireEvent.pointerLeave(screen.getByRole("option", { name: "A" }));

    act(() => {
      vi.advanceTimersByTime(700);
    });
    expect(screen.queryByText("Description A")).toBeNull();
  });

  it("never shows a tooltip for an option with no description", () => {
    openSelect();
    fireEvent.pointerEnter(screen.getByRole("option", { name: "B" }));
    act(() => {
      vi.advanceTimersByTime(700);
    });
    // No description means nothing to show — and nothing else in the list
    // should have appeared either.
    expect(screen.queryByText("Description A")).toBeNull();
  });
});
