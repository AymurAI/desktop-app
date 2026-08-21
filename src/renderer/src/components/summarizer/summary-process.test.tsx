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
    expect(
      screen.getByRole("button", { name: "process.continue" }),
    ).toBeDisabled();
  });

  it("shows a real error message instead of the waiting placeholder when the status is error", () => {
    mockSummarizeState.status = "error";
    render(<SummaryProcess />);
    expect(screen.getByText("process.error")).toBeInTheDocument();
    expect(
      screen.queryByText("process.waitingForWords"),
    ).not.toBeInTheDocument();
  });

  // G8 F3 (tasks/responsive-fixes/issues/G8-pipeline-bugs.md): before this
  // ticket, the "processing" title/subtitle/Callout rendered unconditionally
  // regardless of status, so a finished summary still showed "AymurAI está
  // resumiendo…" (plus its "Aparecerá aquí cuando esté listo" Callout) right
  // next to the finished text and the completed CheckCircle. Each test below
  // fixes both `mockSummarizeState.status` and `mockSummaryState.partialText`
  // explicitly - module state that isn't reset between tests, and the test
  // above deliberately leaves `status` at "error".
  it("hides the processing title/subtitle/callout and shows the finished copy once the summary is completed", () => {
    mockSummarizeState.status = "completed";
    mockSummaryState.partialText = "Resumen final completo del documento.";

    render(<SummaryProcess />);

    expect(
      screen.queryByText("process.processingTitle"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("process.processingSubtitle"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("process.callout")).not.toBeInTheDocument();
    expect(screen.getByText("process.finishedTitle")).toBeInTheDocument();
    expect(screen.getByText("process.finishedSubtitle")).toBeInTheDocument();
    expect(
      screen.getByText("Resumen final completo del documento."),
    ).toBeInTheDocument();
  });

  // "stopped" gets its own copy, distinct from "error": both are non-success
  // outcomes, but only "stopped" was a deliberate user action. It also gets
  // its own Callout in place of the preview area, matching the dataset/
  // anonymizer aggregated screen's treatment of a stopped run.
  it("shows the stopped title/subtitle/callout (not the error copy) when the status is stopped", () => {
    mockSummarizeState.status = "stopped";
    mockSummaryState.partialText = "";

    render(<SummaryProcess />);

    expect(screen.getByText("process.stoppedTitle")).toBeInTheDocument();
    expect(screen.getByText("process.stoppedSubtitle")).toBeInTheDocument();
    expect(screen.getByText("process.stopped")).toBeInTheDocument();
    expect(screen.queryByText("process.errorTitle")).not.toBeInTheDocument();
    expect(screen.queryByText("process.error")).not.toBeInTheDocument();
    expect(screen.queryByText("process.finishedTitle")).not.toBeInTheDocument();
    expect(
      screen.queryByText("process.processingTitle"),
    ).not.toBeInTheDocument();
  });

  // `SummarizeHookStatus` has a fifth value, "idle" (the instant before
  // `useSummarize`'s effect fires its mutation - see that hook), not just
  // processing/completed/error/stopped. The component deliberately folds it
  // into the same display bucket as "processing" rather than giving it its
  // own copy (documented in summary-process.tsx) - this test is the guard
  // for that decision, not an accident of a three-way switch falling through.
  it("treats the idle status (before the mutation fires) the same as processing, not as if it finished or errored", () => {
    mockSummarizeState.status = "idle";
    mockSummaryState.partialText = "";

    render(<SummaryProcess />);

    expect(screen.getByText("process.processingTitle")).toBeInTheDocument();
    expect(screen.getByText("process.processingSubtitle")).toBeInTheDocument();
    expect(screen.getByText("process.callout")).toBeInTheDocument();
  });
});
