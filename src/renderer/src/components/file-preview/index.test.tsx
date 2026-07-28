import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { DocFile } from "@/types/file";
import FilePreview from "./index";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, string | number>) => {
      if (key === "filePreview.meta")
        return `${values?.count} párrafos · ${values?.size}`;
      if (key === "filePreview.removeAria") return `Eliminar ${values?.name}`;
      if (key === "filePreview.loadError")
        return "No se pudo cargar el archivo";
      return key;
    },
  }),
}));

const file: DocFile = {
  data: new File([new Uint8Array(51_200)], "sample.docx"),
  paragraphs: [
    { id: "1", document_id: "sample", value: "Primer párrafo" },
    { id: "2", document_id: "sample", value: "Segundo párrafo" },
  ],
  selected: true,
  validationObject: {},
};

describe("FilePreview", () => {
  it("renders the parsed preview plus an ArchiveRow with a remove action", () => {
    const onRemove = vi.fn();
    render(<FilePreview file={file} status="completed" onRemove={onRemove} />);

    expect(screen.getByRole("img", { name: "sample.docx" })).toHaveAttribute(
      "src",
      expect.stringContaining("data:image/svg+xml"),
    );
    expect(screen.getByText("sample.docx")).toBeInTheDocument();
    expect(screen.getByText("2 párrafos · 50 kb")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /eliminar/i }));
    expect(onRemove).toHaveBeenCalledOnce();
  });

  it("shows a spinner while the file is still parsing, with no ArchiveRow", () => {
    render(
      <FilePreview
        file={{ ...file, paragraphs: undefined }}
        status="processing"
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /eliminar/i })).toBeNull();
  });

  it("shows an accessible error message on parse failure", () => {
    render(<FilePreview file={file} status="error" onRemove={vi.fn()} />);

    expect(
      screen.getByText("No se pudo cargar el archivo"),
    ).toBeInTheDocument();
  });
});
