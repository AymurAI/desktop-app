import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import DecisionTabs from "./index";

describe("DecisionTabs", () => {
  it("renders the default 'Decisión N' labels when no label prop is given", () => {
    render(
      <DecisionTabs
        selected={0}
        decisionAmount={3}
        addDecision={() => {}}
        selectDecision={() => {}}
      />,
    );

    expect(screen.getByText("Decisión 1")).toBeInTheDocument();
    expect(screen.getByText("Decisión 2")).toBeInTheDocument();
    expect(screen.getByText("Decisión 3")).toBeInTheDocument();
  });

  it("renders a custom label prefix", () => {
    render(
      <DecisionTabs
        selected={0}
        decisionAmount={2}
        label="Destinatario"
        addDecision={() => {}}
        selectDecision={() => {}}
      />,
    );

    expect(screen.getByText("Destinatario 1")).toBeInTheDocument();
    expect(screen.getByText("Destinatario 2")).toBeInTheDocument();
  });

  it("renders no remove control when there is only one tab", () => {
    render(
      <DecisionTabs
        selected={0}
        decisionAmount={1}
        addDecision={() => {}}
        selectDecision={() => {}}
        onRemove={() => {}}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /Eliminar/ }),
    ).not.toBeInTheDocument();
  });

  it("calls onRemove with the tab index and does not select the tab", () => {
    const onRemove = vi.fn();
    const selectDecision = vi.fn();
    render(
      <DecisionTabs
        selected={0}
        decisionAmount={2}
        addDecision={() => {}}
        selectDecision={selectDecision}
        onRemove={onRemove}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Eliminar Decisión 2" }),
    );

    expect(onRemove).toHaveBeenCalledWith(1);
    expect(selectDecision).not.toHaveBeenCalled();
  });
});
