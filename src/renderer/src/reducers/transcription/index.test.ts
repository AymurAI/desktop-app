import type { Transcription } from "@/types/transcription";
import { describe, expect, it } from "vitest";
import { renameTranscription } from "./actions";
import reducer from "./index";

function makeTranscription(
  overrides: Partial<Transcription> = {},
): Transcription {
  return {
    id: "t1",
    title: "Audiencia 10/04/2025",
    audioFileName: "a.mp3",
    audioDurationMs: 1000,
    audioObjectUrl: "blob:x",
    speakers: [],
    turns: [],
    createdAt: "2026-06-04T00:00:00.000Z",
    ...overrides,
  };
}

describe("renameTranscription", () => {
  it("renames the matching transcription's title", () => {
    const state = [makeTranscription()];
    const next = reducer(state, renameTranscription("t1", "Nuevo título"));
    expect(next[0].title).toBe("Nuevo título");
  });

  it("leaves other transcriptions untouched and does not mutate input", () => {
    const state = [
      makeTranscription(),
      makeTranscription({ id: "t2", title: "Otro" }),
    ];
    const next = reducer(state, renameTranscription("t1", "Cambiado"));
    expect(next[1].title).toBe("Otro");
    expect(state[0].title).toBe("Audiencia 10/04/2025");
  });
});
