import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PredictStatus } from "@/hooks/usePredict";
import { Route } from "./process";

/**
 * G8 F3 (tasks/responsive-fixes/issues/G8-pipeline-bugs.md): before this
 * ticket, `process.tsx` computed `isProcessing` by scanning the three status
 * tables separately instead of using the already-correct `getCombinedStatus`
 * aggregation, so the success Callout and the error row could render at the
 * same time (Set de Datos) or the "Siguiente" button could stay disabled
 * forever (Anonimizador). See the ticket for why each feature diverges.
 *
 * These tests mock `useFileParse`/`usePredict`/`useDisambiguate` directly to
 * inject per-file statuses - self-contained, no network/backend, matching
 * the pattern in routes/app.$feature/validation.test.tsx and
 * components/validate-dataset/index.test.tsx. Because `react-i18next` is
 * mocked with `t: (key) => key`, these tests assert KEY WIRING (the right
 * copy key is chosen for the right status), not that the Spanish copy is
 * correct or exists - that's a locale file concern, not this component's.
 */

type StatusEntry = {
  status: PredictStatus;
  progress?: number;
  fromValidation?: boolean;
  abort?: () => void;
};
type StatusMap = Record<string, StatusEntry>;

let mockFeature = "DATA_SET";
let mockFiles: Array<{ data: File }> = [];
let mockParseStatuses: StatusMap = {};
let mockPredictStatuses: StatusMap = {};
let mockDisambiguateStatuses: StatusMap = {};

function file(name: string) {
  return { data: new File(["x"], name) };
}

// Sets every stage to "completed" for the given filenames - tests then
// override the one stage/file that should carry a different status.
function setAllCompleted(...names: string[]) {
  for (const name of names) {
    mockParseStatuses[name] = { status: "completed" };
    mockPredictStatuses[name] = { status: "completed", progress: 1 };
    mockDisambiguateStatuses[name] = { status: "completed" };
  }
}

vi.mock("@/hooks", () => ({
  useFiles: () => mockFiles,
  useFileDispatch: () => vi.fn(),
}));
vi.mock("@/hooks/useFileParse", () => ({
  useFileParse: () => mockParseStatuses,
}));
vi.mock("@/hooks/usePredict", () => ({
  usePredict: () => mockPredictStatuses,
}));
vi.mock("@/hooks/useDisambiguate", () => ({
  useDisambiguate: () => mockDisambiguateStatuses,
}));

vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-router")>()),
  useNavigate: () => vi.fn(),
  useParams: () => ({ feature: mockFeature }),
  createFileRoute: () => (options: unknown) => ({ options }),
}));
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ removeQueries: vi.fn() }),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("@/features/RequireFile", () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("@/components", () => ({
  FileProcessing: ({
    fileName,
    status,
  }: {
    fileName: string;
    status: string;
  }) => <div data-testid={`file-status-${fileName}`}>{status}</div>,
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
vi.mock("@/components/ui/back-button", () => ({
  default: () => <button type="button">back</button>,
}));
vi.mock("@/components/summarizer/summary-process", () => ({
  default: () => null,
}));
vi.mock("@/components/voice-to-text/process", () => ({ default: () => null }));

vi.mock("@/services/taskbar", () => ({
  default: { notify: vi.fn() },
}));

function renderProcess() {
  const RouteComponent = Route.options.component;
  if (!RouteComponent) throw new Error("Process route has no component");
  return render(<RouteComponent />);
}

beforeEach(() => {
  mockFeature = "DATA_SET";
  mockFiles = [];
  mockParseStatuses = {};
  mockPredictStatuses = {};
  mockDisambiguateStatuses = {};
});

describe("DocumentProcess (Set de Datos): aggregated status, not per-table", () => {
  it("with a file in error, does not show the finished Callout and shows the error Callout instead", () => {
    mockFiles = [file("a.docx")];
    setAllCompleted("a.docx");
    mockPredictStatuses["a.docx"] = { status: "error", progress: 0.5 };

    renderProcess();

    expect(screen.queryByText("process.finishText")).not.toBeInTheDocument();
    expect(screen.getByText("process.errorText")).toBeInTheDocument();
  });

  it("with all files completed, shows the finished Callout, no error Callout, and the finished title", () => {
    mockFiles = [file("a.docx"), file("b.docx")];
    setAllCompleted("a.docx", "b.docx");

    renderProcess();

    expect(screen.getByText("process.finishText")).toBeInTheDocument();
    expect(screen.queryByText("process.errorText")).not.toBeInTheDocument();
    expect(screen.getByText("process.finishedTitle")).toBeInTheDocument();
    expect(
      screen.queryByText("process.processingTitle"),
    ).not.toBeInTheDocument();
  });

  it("with one file processing and one in error, shows neither success nor 'all done' - error wins", () => {
    mockFiles = [file("a.docx"), file("b.docx")];
    setAllCompleted("a.docx", "b.docx");
    mockPredictStatuses["a.docx"] = { status: "processing", progress: 0.3 };
    mockPredictStatuses["b.docx"] = { status: "error", progress: 0.5 };

    renderProcess();

    expect(screen.queryByText("process.finishText")).not.toBeInTheDocument();
    expect(screen.getByText("process.errorText")).toBeInTheDocument();
  });

  it("with an aborted (stopped) file and nothing else processing, does not show the finished Callout", () => {
    // Decision (documented in process.tsx): "stopped" is folded into the
    // same non-success branch as "error" - an aborted file must never show
    // the success banner, and this Callout doesn't need distinct copy for
    // "you cancelled it" vs "it errored".
    mockFiles = [file("a.docx")];
    setAllCompleted("a.docx");
    mockPredictStatuses["a.docx"] = { status: "stopped", progress: 0.2 };

    renderProcess();

    expect(screen.queryByText("process.finishText")).not.toBeInTheDocument();
    expect(screen.getByText("process.errorText")).toBeInTheDocument();
  });

  it("sad path: with no files, renders no success banner", () => {
    mockFiles = [];

    renderProcess();

    expect(screen.queryByText("process.finishText")).not.toBeInTheDocument();
    expect(screen.queryByText("process.errorText")).not.toBeInTheDocument();
  });
});

describe("DocumentProcess (Anonimizador): the disambiguate-stuck-in-processing bug", () => {
  it("enables 'Siguiente' and shows the error Callout when predict errors, instead of disabling it forever", () => {
    mockFeature = "ANONYMIZER";
    mockFiles = [file("a.docx")];
    mockParseStatuses["a.docx"] = { status: "completed" };
    mockPredictStatuses["a.docx"] = { status: "error", progress: 0.5 };
    // Mirrors the real (buggy, pre-fix) useDisambiguate behavior: it reports
    // "processing" forever once predict has NOT completed successfully -
    // proving the fix works via getCombinedStatus's short-circuit (parse ->
    // predict -> disambiguate), not because this mock happens to say
    // something convenient.
    mockDisambiguateStatuses["a.docx"] = { status: "processing" };

    renderProcess();

    expect(
      screen.getByRole("button", { name: "process.next" }),
    ).not.toBeDisabled();
    expect(screen.getByText("process.errorText")).toBeInTheDocument();
  });
});
