import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SummaryFinish from "./summary-finish";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockDocument = {
  type: "doc",
  content: [
    { type: "paragraph", content: [{ type: "text", text: "Resumen final." }] },
  ],
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
  it("shows the summary's real formatting in the preview, read-only", () => {
    render(<SummaryFinish />);
    expect(screen.getByText("Resumen final.")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Negrita" }),
    ).not.toBeInTheDocument();
  });

  it("exports in the default (.odt) format when 'Exportar' is clicked", async () => {
    render(<SummaryFinish />);
    fireEvent.click(screen.getByRole("button", { name: "finish.export" }));
    expect(mockExportSummary).toHaveBeenCalledWith(
      mockDocument,
      "Resumen acta.docx",
      "odt",
    );
  });
});
