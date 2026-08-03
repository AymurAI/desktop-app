import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DocFile } from "@/types/file";

const navigate = vi.fn();
const retry = vi.fn();
const abort = vi.fn();
const parseAbort = vi.fn();

vi.mock("@tanstack/react-router", () => ({ useNavigate: () => navigate }));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("@/features/RequireFile", () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock("@/components/layout/header", () => ({ default: () => null }));
vi.mock("@/components/layout/main-content", () => ({
  default: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));
vi.mock("@/components/layout/footer", () => ({
  default: ({ children }: { children: ReactNode }) => (
    <footer>{children}</footer>
  ),
}));
vi.mock("@/components/ui/back-button", () => ({ default: () => null }));
vi.mock("@/layout/section-title", () => ({
  SectionTitle: ({ children }: { children: ReactNode }) => <h1>{children}</h1>,
}));
vi.mock("@/services/taskbar", () => ({ default: { notify: vi.fn() } }));
vi.mock("@/components/voice-to-text/format-time", () => ({
  formatTime: (ms: number) => `formatted-${ms}`,
}));

vi.mock("@/components", () => ({
  FileProcessing: ({
    fileName,
    status,
  }: {
    fileName: string;
    status: string;
  }) => (
    <div data-testid="file-processing" data-status={status} title={fileName} />
  ),
}));

vi.mock("@aymurai/ui", () => ({
  Button: ({
    children,
    onClick,
    disabled,
  }: {
    children?: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  Callout: ({ message }: { message: string }) => <output>{message}</output>,
  Card: ({ children }: { children?: ReactNode }) => (
    <section>{children}</section>
  ),
}));

let currentFile: DocFile;
vi.mock("@/hooks", () => ({ useFiles: () => [currentFile] }));

let parseStatus = "completed";
vi.mock("@/hooks/useFileParse", () => ({
  useFileParse: () => ({
    "doc.pdf": { status: parseStatus, abort: parseAbort },
  }),
}));

let extractionStatus = "idle";
vi.mock("@/hooks/useDataExtraction", () => ({
  useDataExtraction: () => ({
    status: extractionStatus,
    error: null,
    retry,
    abort,
  }),
}));

import RecomendacionesProcess from "./process";

function buildFile(paragraphs: DocFile["paragraphs"]): DocFile {
  return {
    data: new File(["x"], "doc.pdf"),
    selected: true,
    validationObject: {},
    paragraphs,
  };
}

describe("RecomendacionesProcess", () => {
  beforeEach(() => {
    navigate.mockReset();
    retry.mockReset();
    abort.mockReset();
    parseAbort.mockReset();
    parseStatus = "completed";
    extractionStatus = "idle";
  });

  // §F2: a scanned/image-only PDF parses "successfully" into ZERO paragraphs
  // (`documentExtractSchema.document` is an unconstrained string[]).
  // `useDataExtraction` then has no `documentId` and reports "idle", which
  // used to leave `combinedStatus` on "processing" forever: no error text,
  // `Siguiente` disabled, and an inert Stop button (the only way out was the
  // back button). It must be a terminal error instead.
  it("(§F2) a completed parse with zero paragraphs surfaces a terminal error, no Reintentar, and Siguiente stays disabled", () => {
    currentFile = buildFile([]);

    render(<RecomendacionesProcess />);

    expect(screen.getByText("process.noTextError")).toBeInTheDocument();
    expect(screen.getByTestId("file-processing")).toHaveAttribute(
      "data-status",
      "error",
    );
    expect(screen.getByText("process.next")).toBeDisabled();
    // `extraction.retry()` is a no-op without a `documentId`, so Reintentar
    // would be a dead control here.
    expect(screen.queryByText("process.retry")).not.toBeInTheDocument();
    expect(screen.queryByText("process.errorText")).not.toBeInTheDocument();
  });

  // `useFileParse` reports "completed" a render before its effect dispatches
  // `addParagraphs`, so for that one render `file.paragraphs` is still
  // `undefined` even though parsing already succeeded. `undefined` must not
  // be treated the same as a genuinely empty `[]`: it should still read as
  // "processing", not flash the scanned-PDF error.
  it("(§F2) a completed parse with paragraphs still undefined is treated as still processing, not an error", () => {
    currentFile = buildFile(undefined);

    render(<RecomendacionesProcess />);

    expect(screen.queryByText("process.noTextError")).not.toBeInTheDocument();
    expect(screen.getByTestId("file-processing")).toHaveAttribute(
      "data-status",
      "processing",
    );
  });

  it("(§F2) a genuine extraction error still shows the generic error text WITH Reintentar", () => {
    currentFile = buildFile([
      { id: "p1", value: "hola", document_id: "doc-1" },
    ]);
    extractionStatus = "error";

    render(<RecomendacionesProcess />);

    expect(screen.getByText("process.errorText")).toBeInTheDocument();
    expect(screen.getByText("process.retry")).toBeInTheDocument();
    expect(screen.queryByText("process.noTextError")).not.toBeInTheDocument();
  });

  it("enables Siguiente once the parse completed and the extraction is ready", () => {
    currentFile = buildFile([
      { id: "p1", value: "hola", document_id: "doc-1" },
    ]);
    extractionStatus = "ready";

    render(<RecomendacionesProcess />);

    expect(screen.getByText("process.next")).toBeEnabled();
    expect(screen.queryByText("process.noTextError")).not.toBeInTheDocument();
  });

  // A slow local-LLM extraction has no numeric progress to show, and used to
  // be indistinguishable from a hang (flat "50%" the whole time). An elapsed
  // indicator should appear while extraction is loading, and disappear once
  // it's ready.
  it("shows an elapsed-time indicator while extraction is loading, and hides it once ready", () => {
    vi.useFakeTimers();
    try {
      currentFile = buildFile([
        { id: "p1", value: "hola", document_id: "doc-1" },
      ]);
      extractionStatus = "loading";

      const { rerender } = render(<RecomendacionesProcess />);

      expect(screen.getByText("process.extracting")).toBeInTheDocument();

      vi.advanceTimersByTime(3000);
      rerender(<RecomendacionesProcess />);
      expect(screen.getByText("process.extracting")).toBeInTheDocument();

      extractionStatus = "ready";
      rerender(<RecomendacionesProcess />);

      expect(screen.queryByText("process.extracting")).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
