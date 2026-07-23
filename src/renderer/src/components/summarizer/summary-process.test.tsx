import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import SummaryProcess from "./summary-process";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockFiles = [
  {
    data: new File(["x"], "acta.docx"),
    paragraphs: [{ id: "p0", document_id: "d0", value: "Texto." }],
    selected: true,
    validationObject: {},
  },
];
vi.mock("@/hooks", () => ({
  useFiles: () => mockFiles,
  useFileDispatch: () => vi.fn(),
}));

const mockSummaryState = { partialText: "", status: "streaming" };
vi.mock("@/context/Summary", () => ({
  useSummary: () => mockSummaryState,
  useSummaryDispatch: () => vi.fn(),
}));

const mockSummarizeState = { status: "processing" };
vi.mock("@/hooks/useSummarize", () => ({
  useSummarize: () => ({ status: mockSummarizeState.status, abort: vi.fn() }),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
}));

// Header/BackButton compose Radix `Link`/`createLink` from `@tanstack/react-router`,
// which needs a real router context — stub them like the sibling voice-to-text
// tests do (see voice-to-text/validation.test.tsx).
vi.mock("@/components/layout/header", () => ({
  default: () => <header />,
}));

vi.mock("@/components/ui/back-button", () => ({
  default: () => <button type="button">back</button>,
}));

// RequireFile also reads `useParams` for its redirect fallback — the
// happy-path files-present branch is all this test needs.
vi.mock("@/features/RequireFile", () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

describe("SummaryProcess", () => {
  it("shows the waiting placeholder before any partial text has streamed in", () => {
    render(<SummaryProcess />);
    expect(screen.getByText("process.waitingForWords")).toBeInTheDocument();
  });

  it("renders streamed partial text once it starts arriving", () => {
    mockSummaryState.partialText = "Primeras palabras del resumen";
    render(<SummaryProcess />);
    expect(
      screen.getByText("Primeras palabras del resumen"),
    ).toBeInTheDocument();
  });

  it("disables the next button until the summary is completed", () => {
    render(<SummaryProcess />);
    expect(screen.getByRole("button", { name: "process.next" })).toBeDisabled();
  });

  it("shows a real error message instead of the waiting placeholder when the status is error", () => {
    mockSummarizeState.status = "error";
    render(<SummaryProcess />);
    expect(screen.getByText("process.error")).toBeInTheDocument();
    expect(
      screen.queryByText("process.waitingForWords"),
    ).not.toBeInTheDocument();
  });
});
