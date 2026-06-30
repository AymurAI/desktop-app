import api from "@/services/api";
import type { Transcription } from "@/types/transcription";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { saveValidation } from "./asrValidation";

describe("saveValidation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("posts validated transcript turns to the ASR validation endpoint", async () => {
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: null });
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

    await saveValidation(transcription);

    expect(post).toHaveBeenCalledWith(
      "/asr/validation/document/doc-1",
      [
        {
          speaker_no: 1,
          speaker_name: "Persona 1",
          start: 0,
          end: 2,
          text: "Texto validado",
        },
      ],
      { signal: undefined },
    );
  });
});
