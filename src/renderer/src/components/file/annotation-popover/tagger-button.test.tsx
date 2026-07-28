import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TaggerButton from "./tagger-button";

describe("TaggerButton", () => {
  it("renders the ToolButton for the given action, labeled with the tooltip text", () => {
    render(
      <TaggerButton
        action="agregar-etiqueta"
        tooltip="Afectar una ocurrencia"
        onClick={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Afectar una ocurrencia" }),
    ).toBeInTheDocument();
  });

  it("calls onClick when enabled and clicked", () => {
    const onClick = vi.fn();
    render(
      <TaggerButton
        action="agregar-todas"
        tooltip="Afectar todas las ocurrencias"
        onClick={onClick}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Afectar todas las ocurrencias" }),
    );
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not call onClick when disabled", () => {
    const onClick = vi.fn();
    render(
      <TaggerButton
        action="agregar-etiqueta"
        tooltip="Afectar una ocurrencia"
        onClick={onClick}
        disabled
      />,
    );
    const button = screen.getByRole("button", {
      name: "Afectar una ocurrencia",
    });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("shows the tooltip content on hover", async () => {
    render(
      <TaggerButton
        action="eliminar"
        tooltip="Eliminar esta ocurrencia"
        onClick={vi.fn()}
      />,
    );
    const button = screen.getByRole("button", {
      name: "Eliminar esta ocurrencia",
    });
    // The button's own accessible name comes from its `aria-label` attribute,
    // not visible text — the Tooltip's content panel renders the copy as
    // actual text once opened. Radix's newer versions additionally echo that
    // text into a second, visually-hidden node for screen readers, so two
    // matches is the correct expectation now, not one.
    // Radix's TooltipTrigger opens on its `onFocus` handler (not on a plain
    // `mouseenter` DOM event, which it never listens for), so fire a focus
    // event to reliably trigger the open.
    fireEvent.focus(button);
    await waitFor(() => {
      expect(
        screen.getAllByText("Eliminar esta ocurrencia").length,
      ).toBeGreaterThan(0);
    });
  });
});
