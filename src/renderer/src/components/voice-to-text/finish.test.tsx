import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Transcription } from "@/types/transcription";
import VoiceFinish from "./finish";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const navigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
}));

// VoiceHeader itself renders `Link` (needs a real router context) — stub it
// out entirely, matching the convention already used in validation.test.tsx.
vi.mock("./header", () => ({
  default: () => <header />,
}));

vi.mock("@/features/RequireFile", () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

const download = vi.fn();
vi.mock("@/services/export/use-export-transcription", () => ({
  useExportTranscription: () => ({ isExporting: false, download }),
}));

const transcription: Transcription = {
  id: "doc-1",
  title: "Audiencia 10/04/2025",
  audioFileName: "a.mp3",
  audioDurationMs: 60_000,
  audioObjectUrl: "blob:x",
  speakers: [
    { id: "s1", label: "Persona 1", initials: "P1", color: "violet" },
    { id: "s2", label: "Jueza", initials: "JU", color: "red" },
  ],
  turns: [
    { id: "a", speakerId: "s1", text: "uno", startMs: 0, endMs: 1000 },
    { id: "b", speakerId: "s2", text: "dos", startMs: 1000, endMs: 2000 },
  ],
  source: "asr",
  createdAt: "2026-01-01T00:00:00.000Z",
};

let currentTranscription: Transcription = transcription;
vi.mock("@/hooks/useTranscriptions", () => ({
  useTranscriptions: () => [currentTranscription],
}));

describe("VoiceFinish export options", () => {
  beforeEach(() => download.mockClear());

  it("exports with speakers and timestamps included by default", () => {
    render(<VoiceFinish />);
    fireEvent.click(screen.getByText("finish.export"));
    expect(download).toHaveBeenCalledWith(
      "odt",
      expect.objectContaining({
        includeSpeakers: true,
        includeTimestamps: true,
      }),
    );
  });

  it("excludes speakers from the export when that switch is turned off", () => {
    render(<VoiceFinish />);
    fireEvent.click(screen.getByLabelText("finish.includeSpeakers"));
    fireEvent.click(screen.getByText("finish.export"));
    expect(download).toHaveBeenCalledWith(
      "odt",
      expect.objectContaining({
        includeSpeakers: false,
        includeTimestamps: true,
      }),
    );
  });

  it("excludes timestamps from the export when that switch is turned off", () => {
    render(<VoiceFinish />);
    fireEvent.click(screen.getByLabelText("finish.includeTimestamps"));
    fireEvent.click(screen.getByText("finish.export"));
    expect(download).toHaveBeenCalledWith(
      "odt",
      expect.objectContaining({
        includeSpeakers: true,
        includeTimestamps: false,
      }),
    );
  });

  it("wires the format select's label to its trigger via a matching id, rendered once", () => {
    render(<VoiceFinish />);
    const labelEls = screen.getAllByText("finish.formatLabel");
    expect(labelEls).toHaveLength(1);
    const [label] = labelEls;
    expect(label.tagName).toBe("LABEL");
    const triggerId = label.getAttribute("for");
    expect(triggerId).toBeTruthy();
    const trigger = document.getElementById(triggerId as string);
    expect(trigger).toHaveAttribute("role", "combobox");
  });

  it("renders the transcription's duration in the summary, between the file and turns lines", () => {
    render(<VoiceFinish />);
    const durationLine = screen.getByText(/finish\.durationLabel/).closest("p");
    // 60_000ms fixture -> "1 min. 0 seg." per formatDuration.
    expect(durationLine).toHaveTextContent("1 min. 0 seg.");
  });

  it("renders a heading for the export options column, matching the summary column", () => {
    render(<VoiceFinish />);
    expect(
      screen.getByRole("heading", { name: "finish.summaryTitle" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "finish.exportOptionsTitle" }),
    ).toBeInTheDocument();
  });
});

describe("VoiceFinish speaker summary", () => {
  afterEach(() => {
    currentTranscription = transcription;
  });

  it("only lists speakers that have at least one turn, excluding leftover editing artifacts", () => {
    // "Defensor/a" has no turns — e.g. created via "Nuevo" while editing,
    // then never actually assigned to any turn — and must not appear here.
    currentTranscription = {
      ...transcription,
      speakers: [
        ...transcription.speakers,
        { id: "s3", label: "Defensor/a", initials: "DE", color: "blue" },
      ],
    };

    render(<VoiceFinish />);
    expect(screen.getByText("Persona 1")).toBeInTheDocument();
    expect(screen.getByText("Jueza")).toBeInTheDocument();
    expect(screen.queryByText("Defensor/a")).toBeNull();
  });

  it("counts only speakers with turns in the 'Personas' summary line", () => {
    currentTranscription = {
      ...transcription,
      speakers: [
        ...transcription.speakers,
        { id: "s3", label: "Defensor/a", initials: "DE", color: "blue" },
      ],
    };

    render(<VoiceFinish />);
    const speakersLine = screen.getByText(/finish\.speakersLabel/).closest("p");
    expect(speakersLine).toHaveTextContent("2");
  });
});
