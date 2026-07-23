import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Tagger from "./tagger";

// null: every test in this file starts with no label pre-selected, matching
// the "disabled until a label is chosen" and "select then click" scenarios
// below. Nothing in this file needs a pre-selected label.
const mockLabel: string | null = null;
vi.mock("@/context/Annotation", () => ({
  useAnnotation: () => ({ label: mockLabel }),
}));

vi.mock("@/store/useLocal", () => ({
  useExcludedTagsConfig: () => ({ tags: [] }),
}));

vi.mock("@/utils/anonymizer/labels", () => ({
  getActiveAnonymizerLabelOptions: () => [
    { id: "PERSONA", text: "Persona" },
    { id: "LUGAR", text: "Lugar" },
  ],
}));

vi.mock("@/components/anonymizer/anonymizer-label-select", () => ({
  default: ({
    value,
    onChange,
  }: {
    value?: string;
    onChange: (option: { id: string; text: string }) => void;
  }) => (
    <select
      aria-label="Etiqueta"
      value={value ?? ""}
      onChange={(e) => onChange({ id: e.target.value, text: e.target.value })}
    >
      <option value="">--</option>
      <option value="PERSONA">Persona</option>
      <option value="LUGAR">Lugar</option>
    </select>
  ),
}));

describe("Tagger", () => {
  it("renders only the add-one/add-all buttons when no delete handlers are passed", () => {
    render(<Tagger onClickOne={vi.fn()} onClickAll={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: "Afectar una ocurrencia" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Afectar todas las ocurrencias" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Eliminar esta ocurrencia" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Eliminar todas las ocurrencias" }),
    ).not.toBeInTheDocument();
  });

  it("renders the delete buttons when their handlers are passed", () => {
    render(
      <Tagger
        onClickOne={vi.fn()}
        onClickAll={vi.fn()}
        onDeleteOne={vi.fn()}
        onDeleteAll={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Eliminar esta ocurrencia" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Eliminar todas las ocurrencias" }),
    ).toBeInTheDocument();
  });

  it("disables add-one/add-all until a label is selected, and enables them once one is", () => {
    render(<Tagger onClickOne={vi.fn()} onClickAll={vi.fn()} />);
    const addOne = screen.getByRole("button", {
      name: "Afectar una ocurrencia",
    });
    expect(addOne).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Etiqueta"), {
      target: { value: "LUGAR" },
    });

    expect(
      screen.getByRole("button", { name: "Afectar una ocurrencia" }),
    ).not.toBeDisabled();
  });

  it("calls onClickOne/onClickAll with the selected label", () => {
    const onClickOne = vi.fn();
    const onClickAll = vi.fn();
    render(<Tagger onClickOne={onClickOne} onClickAll={onClickAll} />);

    fireEvent.change(screen.getByLabelText("Etiqueta"), {
      target: { value: "LUGAR" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Afectar una ocurrencia" }),
    );
    expect(onClickOne).toHaveBeenCalledWith("LUGAR");

    fireEvent.click(
      screen.getByRole("button", { name: "Afectar todas las ocurrencias" }),
    );
    expect(onClickAll).toHaveBeenCalledWith("LUGAR");
  });

  it("calls onDeleteOne/onDeleteAll directly, with no label required", () => {
    const onDeleteOne = vi.fn();
    const onDeleteAll = vi.fn();
    render(
      <Tagger
        onClickOne={vi.fn()}
        onClickAll={vi.fn()}
        onDeleteOne={onDeleteOne}
        onDeleteAll={onDeleteAll}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Eliminar esta ocurrencia" }),
    );
    expect(onDeleteOne).toHaveBeenCalledOnce();
    fireEvent.click(
      screen.getByRole("button", { name: "Eliminar todas las ocurrencias" }),
    );
    expect(onDeleteAll).toHaveBeenCalledOnce();
  });
});
