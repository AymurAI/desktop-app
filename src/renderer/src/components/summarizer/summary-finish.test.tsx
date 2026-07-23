import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SummaryFinish from "./summary-finish";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockDocument = {
  paragraphs: [{ id: "p0", runs: [{ text: "Resumen final.", marks: [] }] }],
};
vi.mock("@/context/Summary", () => ({
  useSummary: () => ({ document: mockDocument, title: "Resumen acta.docx" }),
}));

const { mockExportSummary } = vi.hoisted(() => ({
  mockExportSummary: vi.fn().mockResolvedValue(new Blob(["x"])),
}));
vi.mock("@/services/export/export-summary", () => ({
  exportSummary: mockExportSummary,
}));

vi.mock("@tanstack/react-router", () => ({ useNavigate: () => vi.fn() }));

// Header composes `Link` from `@tanstack/react-router`, which needs a real
// router context — stub it like the sibling summary-validation test does.
vi.mock("@/components/layout/header", () => ({
  default: () => <header />,
}));

describe("SummaryFinish", () => {
  it("shows the read-only summary as the preview", () => {
    render(<SummaryFinish />);
    expect(screen.getByText("Resumen final.")).toBeInTheDocument();
  });

  it("exports in the selected format when 'Exportar' is clicked", async () => {
    render(<SummaryFinish />);
    fireEvent.click(screen.getByRole("button", { name: "finish.export" }));
    expect(mockExportSummary).toHaveBeenCalledWith(
      mockDocument,
      "Resumen acta.docx",
      "txt",
    );
  });
});
