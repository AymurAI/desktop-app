import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import api from "@/services/api";
import type { Transcription } from "@/types/transcription";
import VoiceValidation from "./validation";

const navigate = vi.fn();
const showToast = vi.fn();

const transcription: Transcription = {
  id: "doc-1",
  title: "Audiencia",
  audioFileName: "audiencia.mp3",
  audioDurationMs: 2000,
  audioObjectUrl: "blob:audio",
  source: "asr",
  speakers: [
    { id: "s1", label: "Persona 1", initials: "P1", color: "primary" },
  ],
  turns: [
    {
      id: "turn-1",
      speakerId: "s1",
      speakerNo: 1,
      text: "Texto validado",
      startMs: 0,
      endMs: 2000,
    },
  ],
  createdAt: "2026-06-29T00:00:00.000Z",
};

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("@/features/showToast", () => ({
  showToast: (...args: unknown[]) => showToast(...args),
}));

vi.mock("@/features/RequireFile", () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("./header", () => ({
  default: () => <header />,
}));

vi.mock("@/components/layout/footer", () => ({
  default: ({ children }: { children: ReactNode }) => (
    <footer>{children}</footer>
  ),
}));

vi.mock("@/components/ui/back-button", () => ({
  default: () => <button type="button">back</button>,
}));

vi.mock("@/hooks/useTranscriptions", () => ({
  useTranscriptions: () => [transcription],
}));

vi.mock("./transcription-editor", () => ({
  default: ({ footerActions }: { footerActions?: ReactNode }) => (
    <div>{footerActions}</div>
  ),
}));

describe("VoiceValidation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    navigate.mockReset();
    showToast.mockReset();
  });

  it("does not block finish navigation when validation save fails", async () => {
    vi.spyOn(api, "post").mockRejectedValue(new Error("save failed"));
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <VoiceValidation />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "editor.finish" }));

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith(
        "validation.saveFailed",
        "warning",
      );
      expect(navigate).toHaveBeenCalledWith({
        to: "/app/$feature/finish",
        params: { feature: "VOICE_TO_TEXT" },
      });
    });
  });
});
