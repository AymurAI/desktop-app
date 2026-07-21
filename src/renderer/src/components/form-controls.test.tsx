import { fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { Checkbox } from "./checkbox";
import { Radio, RadioGroup } from "./radio";
import UncontrolledInput from "./uncontrolled-input";

describe("form control adapters", () => {
  it("exposes the ui Checkbox value through the legacy form ref", () => {
    const ref = createRef<{ value: boolean }>();
    render(<Checkbox ref={ref}>Opción</Checkbox>);

    fireEvent.click(screen.getByRole("checkbox", { name: "Opción" }));
    expect(ref.current?.value).toBe(true);
  });

  it("keeps radio group values readable through their refs", () => {
    const firstRef = createRef<{ value: boolean }>();
    const secondRef = createRef<{ value: boolean }>();
    render(
      <RadioGroup name="choice">
        <Radio ref={firstRef}>Primera</Radio>
        <Radio ref={secondRef}>Segunda</Radio>
      </RadioGroup>,
    );

    fireEvent.click(screen.getByRole("radio", { name: "Segunda" }));
    expect(firstRef.current?.value).toBe(false);
    expect(secondRef.current?.value).toBe(true);
  });

  it("preserves accepting TextField suggestions and the imperative value", () => {
    const ref = createRef<{ value: string }>();
    render(<UncontrolledInput ref={ref} label="Nombre" suggestion="AymurAI" />);

    fireEvent.click(screen.getByRole("button", { name: "AymurAI" }));
    expect(screen.getByRole("textbox", { name: "Nombre" })).toHaveValue(
      "AymurAI",
    );
    expect(ref.current?.value).toBe("AymurAI");
  });
});
