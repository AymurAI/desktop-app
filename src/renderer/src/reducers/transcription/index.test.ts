import type { Transcription } from "@/types/transcription";
import { describe, expect, it } from "vitest";
import {
  mergeTurnWithPrevious,
  renameTranscription,
  splitTurn,
} from "./actions";
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

describe("splitTurn", () => {
  const base = () => [
    {
      id: "t1",
      title: "T",
      audioFileName: "a",
      audioDurationMs: 9,
      audioObjectUrl: "b",
      createdAt: "c",
      speakers: [
        {
          id: "s1",
          label: "Persona 1",
          initials: "P1",
          color: "primary" as const,
        },
        {
          id: "s2",
          label: "Juez",
          initials: "JU",
          color: "secondary" as const,
        },
      ],
      turns: [
        {
          id: "ta",
          speakerId: "s1",
          text: "hola mundo cruel",
          startMs: 1000,
          endMs: 5000,
        },
      ],
    },
  ];

  it("splits the middle range into a new speaker, pre/post keep the original", () => {
    const next = reducer(base(), splitTurn("t1", "ta", 5, 10, "s2")); // "mundo"
    const t = next[0].turns;
    expect(t.map((x) => x.text)).toEqual(["hola", "mundo", "cruel"]);
    expect(t.map((x) => x.speakerId)).toEqual(["s1", "s2", "s1"]);
    expect(t[0].startMs).toBe(1000);
  });

  it("reassigns the whole turn when the range covers all text", () => {
    const next = reducer(base(), splitTurn("t1", "ta", 0, 16, "s2"));
    expect(next[0].turns).toHaveLength(1);
    expect(next[0].turns[0].speakerId).toBe("s2");
  });

  it("is a no-op when the trimmed selection is empty", () => {
    const next = reducer(base(), splitTurn("t1", "ta", 4, 5, "s2")); // a space
    expect(next[0].turns).toHaveLength(1);
  });
});

describe("mergeTurnWithPrevious", () => {
  const base = () => [
    {
      id: "t1",
      title: "T",
      audioFileName: "a",
      audioDurationMs: 9,
      audioObjectUrl: "b",
      createdAt: "c",
      speakers: [
        { id: "s1", label: "P1", initials: "P1", color: "primary" as const },
      ],
      turns: [
        { id: "a", speakerId: "s1", text: "uno", startMs: 0, endMs: 1000 },
        { id: "b", speakerId: "s1", text: "dos", startMs: 1000, endMs: 2000 },
      ],
    },
  ];

  it("merges into the previous turn keeping its speaker/start, extending end", () => {
    const next = reducer(base(), mergeTurnWithPrevious("t1", "b"));
    expect(next[0].turns).toHaveLength(1);
    expect(next[0].turns[0].text).toBe("uno dos");
    expect(next[0].turns[0].startMs).toBe(0);
    expect(next[0].turns[0].endMs).toBe(2000);
  });

  it("is a no-op for the first turn", () => {
    expect(
      reducer(base(), mergeTurnWithPrevious("t1", "a"))[0].turns,
    ).toHaveLength(2);
  });
});
