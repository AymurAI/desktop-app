import type { Transcription } from "@/types/transcription";
import { describe, expect, it } from "vitest";
import {
  clearTranscriptions,
  mergeTurnWithPrevious,
  renameSpeakerGlobal,
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
    source: "asr",
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

describe("clearTranscriptions", () => {
  it("resets the state to an empty array", () => {
    const state = [
      makeTranscription(),
      makeTranscription({ id: "t2", title: "Otro" }),
    ];
    const next = reducer(state, clearTranscriptions());
    expect(next).toEqual([]);
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
      source: "asr" as const,
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

  it("apportions the original time range across split pieces by character offset instead of duplicating it", () => {
    // "hola mundo cruel" has 16 chars over [1000, 5000) -> 4000ms / 16 = 250ms/char
    const next = reducer(base(), splitTurn("t1", "ta", 5, 10, "s2")); // "mundo"
    const [pre, mid, post] = next[0].turns;
    expect(pre.startMs).toBe(1000);
    expect(pre.endMs).toBe(2250); // 1000 + 5*250
    expect(mid.startMs).toBe(2250);
    expect(mid.endMs).toBe(3500); // 1000 + 10*250
    expect(post.startMs).toBe(3500);
    expect(post.endMs).toBe(5000);
    // Each piece has its own non-overlapping range — none duplicate the original [1000,5000)
    const ranges = new Set(next[0].turns.map((t) => `${t.startMs}-${t.endMs}`));
    expect(ranges.size).toBe(3);
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

  it("keeps the original turn id on pre (or on post when pre is empty)", () => {
    // pre present -> original id stays on pre (first piece)
    const a = reducer(base(), splitTurn("t1", "ta", 5, 10, "s2")); // "mundo"
    expect(a[0].turns[0].id).toBe("ta");
    // selection from char 0 -> no pre; original id moves to the post piece (last)
    const b = reducer(base(), splitTurn("t1", "ta", 0, 4, "s2")); // "hola"
    const ids = b[0].turns.map((x) => x.id);
    expect(ids).toContain("ta");
    expect(b[0].turns[b[0].turns.length - 1].id).toBe("ta");
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
      source: "asr" as const,
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

describe("renameSpeakerGlobal", () => {
  const base = () => [
    {
      id: "t1",
      title: "T",
      audioFileName: "a",
      audioDurationMs: 9,
      audioObjectUrl: "b",
      createdAt: "c",
      source: "asr" as const,
      speakers: [
        {
          id: "s1",
          label: "Locutor 1",
          initials: "L1",
          color: "primary" as const,
        },
        {
          id: "s2",
          label: "Locutor 2",
          initials: "L2",
          color: "secondary" as const,
        },
      ],
      turns: [
        { id: "a", speakerId: "s1", text: "x", startMs: 0, endMs: 1 },
        { id: "b", speakerId: "s2", text: "y", startMs: 1, endMs: 2 },
        { id: "c", speakerId: "s2", text: "z", startMs: 2, endMs: 3 },
      ],
    },
  ];

  it("renames in place and recomputes initials when no other speaker has that label", () => {
    const next = reducer(base(), renameSpeakerGlobal("t1", "s2", "Juez"));
    expect(next[0].speakers).toHaveLength(2);
    const s2 = next[0].speakers.find((s) => s.id === "s2");
    expect(s2?.label).toBe("Juez");
    expect(s2?.initials).toBe("JU");
  });

  it("merges into the existing speaker when the new label already exists (case-insensitive)", () => {
    // s1 -> "Juez"
    let st = reducer(base(), renameSpeakerGlobal("t1", "s1", "Juez"));
    // s2 -> "juez" collides with s1's "Juez" => merge s2 into s1
    st = reducer(st, renameSpeakerGlobal("t1", "s2", "juez"));
    expect(st[0].speakers).toHaveLength(1);
    expect(st[0].speakers[0].id).toBe("s1");
    expect(st[0].turns.every((t) => t.speakerId === "s1")).toBe(true);
  });

  it("does not merge or drop the speaker when renaming to its own label (case change)", () => {
    const next = reducer(base(), renameSpeakerGlobal("t1", "s1", "LOCUTOR 1"));
    expect(next[0].speakers).toHaveLength(2);
    expect(next[0].speakers.find((s) => s.id === "s1")?.label).toBe(
      "LOCUTOR 1",
    );
  });
});
