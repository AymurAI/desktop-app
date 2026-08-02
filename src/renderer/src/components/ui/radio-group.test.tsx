import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Radio } from "@aymurai/ui";
import { RadioGroup } from "./radio-group";

describe("RadioGroup", () => {
  it("renders the legend", () => {
    render(
      <RadioGroup label="Tipo de audiencia" name="tipo">
        <Radio value="oral">Oral</Radio>
        <Radio value="escrita">Escrita</Radio>
      </RadioGroup>,
    );

    expect(
      screen.getByRole("group", { name: "Tipo de audiencia" }),
    ).toBeInTheDocument();
  });

  it("passes the shared name down to every child", () => {
    render(
      <RadioGroup label="Tipo de audiencia" name="tipo">
        <Radio value="oral">Oral</Radio>
        <Radio value="escrita">Escrita</Radio>
      </RadioGroup>,
    );

    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(2);
    for (const radio of radios) {
      expect(radio).toHaveAttribute("name", "tipo");
    }
  });
});
