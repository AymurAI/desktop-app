import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SummaryValidation from "./summary-validation";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockFiles = [
  {
    data: new File(["x"], "acta.docx"),
    paragraphs: [
      { id: "p0", document_id: "d0", value: "Texto original completo." },
    ],
    selected: true,
    validationObject: {},
  },
];
vi.mock("@/hooks", () => ({ useFiles: () => mockFiles }));

const mockDocument = {
  paragraphs: [{ id: "p0", runs: [{ text: "Resumen generado.", marks: [] }] }],
};

const { mockDispatch, mockSave, mockNavigate } = vi.hoisted(() => ({
  mockDispatch: vi.fn(),
  mockSave: vi.fn().mockResolvedValue(undefined),
  mockNavigate: vi.fn(),
}));

vi.mock("@/context/Summary", () => ({
  useSummary: () => ({
    status: "completed",
    document: mockDocument,
    title: "Resumen acta.docx",
    sourceFileName: "acta.docx",
  }),
  useSummaryDispatch: () => mockDispatch,
  edit: (document: unknown) => ({ type: "edit", document }),
  editTitle: (title: string) => ({ type: "editTitle", title }),
}));

vi.mock("@/services/aymurai/summaryValidationClient", () => ({
  summaryValidationClient: { save: mockSave, load: vi.fn() },
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

// Header/BackButton compose Radix `Link`/`createLink` from `@tanstack/react-router`,
// which needs a real router context — stub them like the sibling
// summary-process/voice-to-text tests do.
vi.mock("@/components/layout/header", () => ({
  default: () => <header />,
}));

vi.mock("@/components/ui/back-button", () => ({
  default: () => <button type="button">back</button>,
}));

describe("SummaryValidation", () => {
  it("renders both the original document panel and the summary editor", () => {
    render(<SummaryValidation />);
    expect(screen.getByText(/Texto original completo/)).toBeInTheDocument();
    expect(screen.getByText("Resumen generado.")).toBeInTheDocument();
  });

  it("saves via the persistence adapter when the editor content changes", () => {
    render(<SummaryValidation />);
    fireEvent.blur(screen.getByRole("textbox"));
    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({
        documentId: "acta.docx",
        title: "Resumen acta.docx",
      }),
    );
  });
});
