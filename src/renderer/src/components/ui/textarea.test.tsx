import { fireEvent, render, screen } from "@testing-library/react";
import { type ComponentProps, useState } from "react";
import { describe, expect, it } from "vitest";

import { Textarea } from "./textarea";

function ControlledTextarea(
  props: Omit<ComponentProps<typeof Textarea>, "value" | "onChange"> & {
    initialValue?: string;
  },
) {
  const { initialValue, ...rest } = props;
  const [value, setValue] = useState(initialValue ?? "");
  return (
    <Textarea
      {...rest}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}

describe("Textarea", () => {
  it("associates the label with the control", () => {
    render(<Textarea label="Resumen" value="" onChange={() => {}} />);

    expect(
      screen.getByRole("textbox", { name: "Resumen" }),
    ).toBeInTheDocument();
  });

  it("fires onChange with the typed text", () => {
    render(<ControlledTextarea label="Resumen" />);

    const textbox = screen.getByRole("textbox", { name: "Resumen" });
    fireEvent.change(textbox, { target: { value: "hola mundo" } });

    expect(textbox).toHaveValue("hola mundo");
  });

  it("shows the error text and sets aria-invalid", () => {
    render(
      <Textarea
        label="Resumen"
        value=""
        onChange={() => {}}
        error="Campo requerido"
      />,
    );

    const textbox = screen.getByRole("textbox", { name: "Resumen" });
    expect(textbox).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Campo requerido");
  });

  it("renders the suggestion below the control", () => {
    render(
      <Textarea
        label="Resumen"
        value=""
        onChange={() => {}}
        suggestion="Texto sugerido"
      />,
    );

    expect(screen.getByText("Texto sugerido")).toBeInTheDocument();
  });
});
