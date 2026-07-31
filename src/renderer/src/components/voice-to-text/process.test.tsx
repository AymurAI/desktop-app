import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import VoiceProcess from "./process";

/**
 * G8 F3 (tasks/responsive-fixes/issues/G8-pipeline-bugs.md): before this
 * ticket, the "processing" title/subtitle/Callout in voice-to-text/process.tsx
 * rendered unconditionally regardless of status, so a finished transcription
 * still showed "AymurAI está transcribiendo el archivo." plus its
 * "Aparecerá aquí cuando esté listo" Callout right next to the finished
 * transcript text - the exact banner the tester's report described.
 *
 * Mocks `@/hooks/useTranscribe` directly to inject each status, following the
 * same self-contained, no-network pattern as
 * components/summarizer/summary-process.test.tsx (this screen had no test
 * file at all before this ticket). Because `react-i18next` is mocked with
 * `t: (key) => key`, these tests assert KEY WIRING (the right copy key is
 * chosen for the right status), not that the Spanish copy is correct or
 * exists - that's a locale file concern, not this component's.
 */

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockFiles = [
  {
    data: new File(["x"], "audiencia.webm"),
    durationMs: 60_000,
  },
];
vi.mock("@/hooks", () => ({
  useFiles: () => mockFiles,
  useFileDispatch: () => vi.fn(),
}));

const dispatch = vi.fn();
vi.mock("@/hooks/useTranscriptions", () => ({
  useTranscriptionDispatch: () => dispatch,
}));

const mockTranscribeState: {
  status: "idle" | "processing" | "completed" | "error" | "stopped";
  partialText: string;
} = { status: "processing", partialText: "" };
vi.mock("@/hooks/useTranscribe", () => ({
  useTranscribe: () => ({
    progress: 0,
    status: mockTranscribeState.status,
    partialText: mockTranscribeState.partialText,
    abort: vi.fn(),
  }),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
}));

// Header/BackButton compose Radix `Link`/`createLink` from `@tanstack/react-router`,
// which needs a real router context - stub them like the sibling voice-to-text
// tests do (see voice-to-text/validation.test.tsx).
vi.mock("@/components/layout/header", () => ({
  default: () => <header />,
}));

vi.mock("@/components/ui/back-button", () => ({
  default: () => <button type="button">back</button>,
}));

// RequireFile also reads `useParams` for its redirect fallback - the
// happy-path files-present branch is all this test needs.
vi.mock("@/features/RequireFile", () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

describe("VoiceProcess", () => {
  it("shows the waiting placeholder before any partial text has streamed in", () => {
    mockTranscribeState.status = "processing";
    mockTranscribeState.partialText = "";

    render(<VoiceProcess />);

    expect(screen.getByText("process.waitingForWords")).toBeInTheDocument();
  });

  it("renders streamed partial text once it starts arriving", () => {
    mockTranscribeState.status = "processing";
    mockTranscribeState.partialText = "Primeras palabras de la transcripción";

    render(<VoiceProcess />);

    expect(
      screen.getByText("Primeras palabras de la transcripción"),
    ).toBeInTheDocument();
  });

  it("disables the next button until the transcription is completed", () => {
    mockTranscribeState.status = "processing";
    mockTranscribeState.partialText = "";

    render(<VoiceProcess />);

    expect(screen.getByRole("button", { name: "process.next" })).toBeDisabled();
  });

  // G8 F3: the core regression guard. Fails today (before this ticket) via
  // the Callout, exactly what the report cited - `!isError && !isStopped`
  // is true when completed, so the "Transcribiendo audio…" banner rendered
  // right next to the finished transcript.
  it("hides the processing title/subtitle/callout and shows the finished copy once the transcription is completed", () => {
    mockTranscribeState.status = "completed";
    mockTranscribeState.partialText = "Transcripción final completa.";

    render(<VoiceProcess />);

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
      screen.getByText("Transcripción final completa."),
    ).toBeInTheDocument();
  });

  it("shows the error title/subtitle instead of the processing copy when the status is error", () => {
    mockTranscribeState.status = "error";
    mockTranscribeState.partialText = "";

    render(<VoiceProcess />);

    expect(
      screen.queryByText("process.processingTitle"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("process.callout")).not.toBeInTheDocument();
    expect(screen.getByText("process.errorTitle")).toBeInTheDocument();
    expect(screen.getByText("process.errorSubtitle")).toBeInTheDocument();
  });

  // "stopped" folds into the same non-success branch as "error" - matching
  // routes/app.$feature/process.tsx's G8 F3 decision (documented in
  // process.tsx) - so a cancelled run shows the same errorTitle/Subtitle,
  // not its own copy.
  it("shows the error title/subtitle (not a separate copy) when the status is stopped", () => {
    mockTranscribeState.status = "stopped";
    mockTranscribeState.partialText = "";

    render(<VoiceProcess />);

    expect(screen.getByText("process.errorTitle")).toBeInTheDocument();
    expect(screen.getByText("process.errorSubtitle")).toBeInTheDocument();
    expect(screen.queryByText("process.finishedTitle")).not.toBeInTheDocument();
  });

  // `TranscribeStatus` has a fifth value, "idle" (the instant before
  // `useTranscribe`'s effect fires its mutation - see that hook), not just
  // processing/completed/error/stopped. The component deliberately folds it
  // into the same display bucket as "processing" rather than giving it its
  // own copy (documented in process.tsx) - this test is the guard for that
  // decision, not an accident of a three-way switch falling through.
  it("treats the idle status (before the mutation fires) the same as processing, not as if it finished or errored", () => {
    mockTranscribeState.status = "idle";
    mockTranscribeState.partialText = "";

    render(<VoiceProcess />);

    expect(screen.getByText("process.processingTitle")).toBeInTheDocument();
    expect(screen.getByText("process.processingSubtitle")).toBeInTheDocument();
    expect(screen.getByText("process.callout")).toBeInTheDocument();
  });
});
