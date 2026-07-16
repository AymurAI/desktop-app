import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

vi.mock("@/hooks/useTranscriptions", () => ({
  useTranscriptions: () => [transcription],
}));

describe("VoiceFinish export options", () => {
  beforeEach(() => download.mockClear());

  it("exports with speakers and timestamps included by default", () => {
    render(<VoiceFinish />);
    fireEvent.click(screen.getByText("finish.export"));
    expect(download).toHaveBeenCalledWith(
      "txt",
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
      "txt",
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
      "txt",
      expect.objectContaining({
        includeSpeakers: true,
        includeTimestamps: false,
      }),
    );
  });
});
