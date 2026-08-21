import { PERSONA_LABEL_TEMPLATE } from "@/constants/i18n/locales/es/voice-to-text";
import { SPEAKER_PALETTE, type Transcription } from "@/types/transcription";
import { describe, expect, it } from "vitest";
import {
  addPersonaSpeaker,
  clearTranscriptions,
  mergeTurnWithNext,
  mergeTurnWithPrevious,
  reassignTurnSpeaker,
  renameSpeakerGlobal,
  renameTranscription,
  splitTurn,
  updateTurnStartMs,
} from "./actions";
import reducer, { computeInitials, nextPersonaLabel } from "./index";

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

  it("has mid absorb a dropped edge's time span instead of leaving a coverage gap", () => {
    // Leading space: startChar=1 makes `pre` ("".trim()) empty even though
    // startChar > 0, so its [0, startChar) time span must not be lost.
    const state = [
      {
        id: "t1",
        title: "T",
        audioFileName: "a",
        audioDurationMs: 2000,
        audioObjectUrl: "b",
        createdAt: "c",
        source: "asr" as const,
        speakers: [
          { id: "s1", label: "P1", initials: "P1", color: "primary" as const },
          {
            id: "s2",
            label: "P2",
            initials: "P2",
            color: "secondary" as const,
          },
        ],
        turns: [
          {
            id: "ta",
            speakerId: "s1",
            text: " Hola mundo",
            startMs: 0,
            endMs: 2000,
          },
        ],
      },
    ];
    const next = reducer(state, splitTurn("t1", "ta", 1, 5, "s2")); // "Hola"
    const [mid, post] = next[0].turns;
    expect(next[0].turns).toHaveLength(2); // pre dropped (whitespace-only)
    expect(mid.text).toBe("Hola");
    expect(mid.startMs).toBe(0); // absorbs the dropped pre's span, not msAt(1)
    expect(post.text).toBe("mundo");
    expect(mid.endMs).toBe(post.startMs); // contiguous, no gap
    expect(post.endMs).toBe(2000);
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

describe("updateTurnStartMs", () => {
  it("moves the preceding end to the boundary and extends the last turn to the audio end", () => {
    const state = [
      makeTranscription({
        audioDurationMs: 9000,
        turns: [
          {
            id: "chunk-1",
            speakerId: "s1",
            text: "first",
            startMs: 1000,
            endMs: 2400,
          },
          {
            id: "chunk-2",
            speakerId: "s1",
            text: "second",
            startMs: 2400,
            endMs: 8600,
          },
        ],
      }),
    ];

    const next = reducer(state, updateTurnStartMs("t1", "chunk-2", 2000));

    expect(next[0].turns).toEqual([
      expect.objectContaining({ id: "chunk-1", startMs: 1000, endMs: 2000 }),
      expect.objectContaining({ id: "chunk-2", startMs: 2000, endMs: 9000 }),
    ]);
    expect(state[0].turns[0].endMs).toBe(2400);
  });

  it("preserves the edited turn's duration when another turn follows", () => {
    const state = [
      makeTranscription({
        audioDurationMs: 9000,
        turns: [
          {
            id: "chunk-1",
            speakerId: "s1",
            text: "first",
            startMs: 1000,
            endMs: 2400,
          },
          {
            id: "chunk-2",
            speakerId: "s1",
            text: "second",
            startMs: 2400,
            endMs: 4400,
          },
          {
            id: "chunk-3",
            speakerId: "s1",
            text: "third",
            startMs: 7000,
            endMs: 9000,
          },
        ],
      }),
    ];

    const next = reducer(state, updateTurnStartMs("t1", "chunk-2", 3000));

    expect(next[0].turns[0].endMs).toBe(3000);
    expect(next[0].turns[1]).toEqual(
      expect.objectContaining({ startMs: 3000, endMs: 5000 }),
    );
    expect(next[0].turns[2].endMs).toBe(9000);
  });

  it("does not change another turn when the target does not exist", () => {
    const state = [
      makeTranscription({
        turns: [
          {
            id: "chunk-1",
            speakerId: "s1",
            text: "first",
            startMs: 1000,
            endMs: 2400,
          },
        ],
      }),
    ];

    expect(
      reducer(state, updateTurnStartMs("t1", "missing", 2000)),
    ).toStrictEqual(state);
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

describe("mergeTurnWithNext", () => {
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
        { id: "s1", label: "P1", initials: "P1", color: "violet" as const },
        { id: "s2", label: "P2", initials: "P2", color: "green" as const },
      ],
      turns: [
        { id: "a", speakerId: "s1", text: "uno", startMs: 0, endMs: 1000 },
        { id: "b", speakerId: "s2", text: "dos", startMs: 1000, endMs: 2000 },
      ],
    },
  ];

  it("keeps the selected turn and adopts the next turn's speaker", () => {
    const next = reducer(base(), mergeTurnWithNext("t1", "a"));
    expect(next[0].turns).toEqual([
      {
        id: "a",
        speakerId: "s2",
        text: "uno dos",
        startMs: 0,
        endMs: 2000,
      },
    ]);
  });

  it("is a no-op for the last turn", () => {
    expect(reducer(base(), mergeTurnWithNext("t1", "b"))[0].turns).toHaveLength(
      2,
    );
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

// G7 (tasks/responsive-fixes/issues/G7-modo-edicion-personas.md), criterion
// 2: renaming one speaker must never change another speaker's label. This
// block used to be "renameSpeakerGlobal renumbering" and its first two
// cases asserted the OPPOSITE of what's tested now — that a rename/merge
// renumbered every remaining "Persona N" speaker to stay contiguous. That
// was `renumberPersonaSpeakers` (removed from `RENAME_SPEAKER_GLOBAL`): a
// deliberate reversion of intentional behavior, not an accident fix — see
// the comment at its old call site in index.ts. The contract forbids
// deleting or skipping tests, so those two assertions are INVERTED here
// rather than removed; the third case ("leaves numbering untouched...")
// needed no change and is now the general rule instead of the exception
// that survives only when no gap is created.
describe("renameSpeakerGlobal leaves other speakers' labels untouched", () => {
  const baseSpeakers = () => [
    { id: "s1", label: "Persona 1", initials: "P1", color: "violet" as const },
    { id: "s2", label: "Persona 2", initials: "P2", color: "green" as const },
    { id: "s3", label: "Jueza", initials: "JU", color: "red" as const },
  ];
  const baseTurns = () => [
    { id: "turn1", speakerId: "s1", text: "a", startMs: 0, endMs: 100 },
    { id: "turn2", speakerId: "s2", text: "b", startMs: 100, endMs: 200 },
  ];

  it("does not renumber other Persona speakers after a plain rename", () => {
    const state = [
      makeTranscription({ speakers: baseSpeakers(), turns: baseTurns() }),
    ];
    const next = reducer(state, renameSpeakerGlobal("t1", "s1", "Fiscal"));
    const speakers = next[0].speakers;
    expect(speakers.find((s) => s.id === "s2")).toMatchObject({
      label: "Persona 2",
      initials: "P2",
    });
    expect(speakers.find((s) => s.id === "s3")?.label).toBe("Jueza");
  });

  it("does not renumber other Persona speakers after a merge-collision rename", () => {
    const state = [
      makeTranscription({
        speakers: [
          {
            id: "s1",
            label: "Persona 1",
            initials: "P1",
            color: "violet" as const,
          },
          {
            id: "s2",
            label: "Persona 2",
            initials: "P2",
            color: "green" as const,
          },
          { id: "s3", label: "Fiscal", initials: "FI", color: "red" as const },
        ],
        turns: baseTurns(),
      }),
    ];
    // "Persona 1" collides with the existing "Fiscal" speaker -> merges s1
    // into s3 and drops s1. s2 keeps its own label — no renumbering fills
    // the gap s1 leaves behind.
    const next = reducer(state, renameSpeakerGlobal("t1", "s1", "Fiscal"));
    const speakers = next[0].speakers;
    expect(speakers.find((s) => s.id === "s1")).toBeUndefined();
    expect(speakers.find((s) => s.id === "s2")?.label).toBe("Persona 2");
  });

  it("leaves numbering untouched when no gap is created", () => {
    const state = [
      makeTranscription({ speakers: baseSpeakers(), turns: baseTurns() }),
    ];
    const next = reducer(state, renameSpeakerGlobal("t1", "s3", "Defensor/a"));
    const speakers = next[0].speakers;
    expect(speakers.find((s) => s.id === "s1")?.label).toBe("Persona 1");
    expect(speakers.find((s) => s.id === "s2")?.label).toBe("Persona 2");
  });

  // Criterion 2, the exact scenario measured against the real defect: with
  // four "Persona N" speakers, renaming the SECOND one used to shift every
  // speaker after it down by one (s3 "Persona 3" -> "Persona 2", s4
  // "Persona 4" -> "Persona 3") - worse than the report described (it said
  // an upward shift; measured behavior was downward), and a genuine
  // correctness bug: whoever wrote down "Persona 3" a moment ago is now
  // looking at a different person.
  it("renaming the second of four Persona speakers leaves the other three's id and label untouched", () => {
    const state = [
      makeTranscription({
        speakers: [
          {
            id: "s1",
            label: "Persona 1",
            initials: "P1",
            color: "violet" as const,
          },
          {
            id: "s2",
            label: "Persona 2",
            initials: "P2",
            color: "green" as const,
          },
          {
            id: "s3",
            label: "Persona 3",
            initials: "P3",
            color: "red" as const,
          },
          {
            id: "s4",
            label: "Persona 4",
            initials: "P4",
            color: "yellow" as const,
          },
        ],
      }),
    ];
    const next = reducer(state, renameSpeakerGlobal("t1", "s2", "Testigo"));
    const speakers = next[0].speakers;
    expect(speakers.find((s) => s.id === "s1")).toMatchObject({
      id: "s1",
      label: "Persona 1",
    });
    expect(speakers.find((s) => s.id === "s2")?.label).toBe("Testigo");
    expect(speakers.find((s) => s.id === "s3")).toMatchObject({
      id: "s3",
      label: "Persona 3",
    });
    expect(speakers.find((s) => s.id === "s4")).toMatchObject({
      id: "s4",
      label: "Persona 4",
    });
  });

  // Visible production change (documented, not incidental): without
  // renumbering, a gap left by a merge-collision drop is never backfilled.
  // `nextPersonaLabel` already computes "one past the highest existing
  // number" (never "count + 1"), so the gap can never cause a label
  // collision - it's just a gap (1, 2, 4, 5 after "Persona 3" is dropped).
  it("does not fill the gap a merge-collision rename leaves behind", () => {
    const state = [
      makeTranscription({
        speakers: [
          {
            id: "s1",
            label: "Persona 1",
            initials: "P1",
            color: "violet" as const,
          },
          {
            id: "s2",
            label: "Persona 2",
            initials: "P2",
            color: "green" as const,
          },
          {
            id: "s3",
            label: "Persona 3",
            initials: "P3",
            color: "red" as const,
          },
          {
            id: "s4",
            label: "Persona 4",
            initials: "P4",
            color: "yellow" as const,
          },
        ],
      }),
    ];
    // Renaming s3 to "Persona 2" collides with s2 -> merges s3 into s2 and
    // drops s3, leaving a gap at 3.
    const afterMerge = reducer(
      state,
      renameSpeakerGlobal("t1", "s3", "Persona 2"),
    );
    expect(afterMerge[0].speakers.map((s) => s.id)).toEqual(["s1", "s2", "s4"]);
    expect(afterMerge[0].speakers.map((s) => s.label)).toEqual([
      "Persona 1",
      "Persona 2",
      "Persona 4",
    ]);

    // The next auto-created persona is "Persona 5" (one past the max, 4) -
    // NOT "Persona 3" (filling the gap) and NOT "Persona 4" (speaker count).
    const next = reducer(afterMerge, addPersonaSpeaker("t1", "new-id"));
    expect(next[0].speakers.find((s) => s.id === "new-id")?.label).toBe(
      "Persona 5",
    );
  });
});

// G7 (tasks/responsive-fixes/issues/G7-modo-edicion-personas.md), criterion
// 4: "Persona 10", "Persona 11" and "Persona 12" used to all collapse to the
// same "P1" (both branches took `slice(0, 2)`), so their avatars were
// indistinguishable. Only the last-word-numeric branch grows to 3
// characters — the single-word and non-numeric-multi-word branches must
// stay at 2 (`index.test.ts:392` already pins "Jueza" -> "JU" after a
// rename; asserted again here directly).
describe("computeInitials", () => {
  it("keeps single-digit numeric labels at 2 characters", () => {
    expect(computeInitials("Persona 9")).toBe("P9");
  });

  it("grows to 3 characters once the trailing number reaches double digits", () => {
    expect(computeInitials("Persona 10")).toBe("P10");
    expect(computeInitials("Persona 12")).toBe("P12");
    expect(computeInitials("Locutor 11")).toBe("L11");
  });

  it("truncates a triple-digit trailing number to 3 characters total (documented collision beyond Persona 99)", () => {
    // "Persona 100" collides with "Persona 10" on "P10" - a real, accepted
    // limit: 4 characters would overflow the avatar's 24px circle, so
    // uniqueness by initials alone is only guaranteed through Persona 99;
    // beyond that, color and the full label (shown next to the badge)
    // disambiguate.
    expect(computeInitials("Persona 100")).toBe("P10");
  });

  it("still takes the first two characters for a single word", () => {
    expect(computeInitials("Jueza")).toBe("JU");
  });

  it("still takes the first letter of the first two words for a multi-word, non-numeric name", () => {
    expect(computeInitials("Dra. Silva")).toBe("DS");
    expect(computeInitials("Ministerio Publico Fiscal")).toBe("MP");
  });
});

describe("nextPersonaLabel", () => {
  it("starts at Persona 1 when there are no speakers at all", () => {
    expect(nextPersonaLabel([])).toBe("Persona 1");
  });

  it("starts at Persona 1 when only custom-named speakers exist", () => {
    // Regression: the only speaker was renamed from "Persona 1" to "JFK" —
    // the next auto-generated speaker must not count JFK toward the number.
    const speakers = [
      { id: "s1", label: "JFK", initials: "JF", color: "violet" as const },
    ];
    expect(nextPersonaLabel(speakers)).toBe("Persona 1");
  });

  it("continues one past the highest existing Persona N, ignoring other speakers", () => {
    const speakers = [
      { id: "s1", label: "JFK", initials: "JF", color: "violet" as const },
      { id: "s2", label: "Persona 1", initials: "P1", color: "green" as const },
    ];
    expect(nextPersonaLabel(speakers)).toBe("Persona 2");
  });

  it("uses the highest number, not the count, when there's a gap (1, 2, 4 -> 5)", () => {
    const speakers = [
      {
        id: "s1",
        label: "Persona 1",
        initials: "P1",
        color: "violet" as const,
      },
      { id: "s2", label: "Persona 2", initials: "P2", color: "green" as const },
      { id: "s3", label: "Persona 4", initials: "P4", color: "blue" as const },
    ];
    expect(nextPersonaLabel(speakers)).toBe("Persona 5");
  });

  // G7 i18n restriction (tasks/responsive-fixes/issues/G7-modo-edicion-
  // personas.md): the guard against `nextPersonaLabel`'s recognizer regex
  // drifting apart from the label it generates, now that both derive from
  // `PERSONA_LABEL_TEMPLATE` (constants/i18n/locales/es/voice-to-text.ts)
  // instead of two independently hand-maintained strings. Several
  // custom-named speakers interleaved with several auto-generated ones -
  // if the derivation ever broke (e.g. the regex stopped matching the
  // template's own output), this would silently reset to "Persona 1"
  // instead of continuing past the highest existing number.
  it("does not reset the counter when auto-generated speakers are interleaved with several custom-named ones", () => {
    const speakers = [
      {
        id: "s1",
        label: "Persona 2",
        initials: "P2",
        color: "violet" as const,
      },
      {
        id: "s2",
        label: "Dra. Silva",
        initials: "DS",
        color: "green" as const,
      },
      { id: "s3", label: "Persona 5", initials: "P5", color: "blue" as const },
      { id: "s4", label: "Fiscal", initials: "FI", color: "red" as const },
    ];
    expect(nextPersonaLabel(speakers)).toBe("Persona 6");
  });

  // Proves the label RESOLVES to a real string built from
  // `PERSONA_LABEL_TEMPLATE` - not an i18next key (this reducer never calls
  // `t()` for this label, by design; see the docblock on
  // `derivePersonaLabelRegex` in index.ts) and not the raw `{{n}}`
  // placeholder left unsubstituted.
  it("resolves the label from PERSONA_LABEL_TEMPLATE, not an i18next key or an unsubstituted placeholder", () => {
    expect(PERSONA_LABEL_TEMPLATE).toBe("Persona {{n}}");
    const label = nextPersonaLabel([]);
    expect(label).toBe(PERSONA_LABEL_TEMPLATE.replace("{{n}}", "1"));
    expect(label).not.toContain("{{");
    expect(label).not.toContain("voice-to-text:");
  });
});

// G7 F4 (tasks/responsive-fixes/issues/G7-modo-edicion-personas.md): the
// "+ Nuevo" race. `handleNewPerson` (turn-side-panel.tsx) used to compute
// label/initials/color itself from a `speakers` PROP shared by every
// handler in a React batch, then dispatch a fully-formed speaker through
// the generic `ADD_SPEAKER` (which just appends) - so N handlers in the
// same batch produced N speakers with the SAME label, initials, AND color.
// `ADD_PERSONA_SPEAKER` moves the derivation into the reducer, which reads
// `t.speakers` from the ACCUMULATED state at apply time - this is the real
// guarantee, and it does NOT depend on how React batches anything: applying
// the action N times in a row on the state each previous dispatch returned
// (exactly what happens whether React batches the dispatches or not) must
// produce N distinct labels/colors.
describe("addPersonaSpeaker", () => {
  it("N sequential dispatches on the returned state produce N distinct labels, initials and colors", () => {
    let state = [makeTranscription()];
    const ids = ["id-1", "id-2", "id-3", "id-4"];
    for (const id of ids) {
      state = reducer(state, addPersonaSpeaker("t1", id));
    }

    const speakers = state[0].speakers;
    expect(speakers.map((s) => s.id)).toEqual(ids);
    expect(speakers.map((s) => s.label)).toEqual([
      "Persona 1",
      "Persona 2",
      "Persona 3",
      "Persona 4",
    ]);
    expect(speakers.map((s) => s.initials)).toEqual(["P1", "P2", "P3", "P4"]);
    expect(new Set(speakers.map((s) => s.label)).size).toBe(4);
    expect(new Set(speakers.map((s) => s.color)).size).toBe(4);
  });

  it("uses the id supplied in the payload, not one generated by the reducer", () => {
    const next = reducer(
      [makeTranscription()],
      addPersonaSpeaker("t1", "fixed-id"),
    );
    expect(next[0].speakers[0].id).toBe("fixed-id");
  });

  it("colors from SPEAKER_PALETTE indexed by the current speaker count", () => {
    let state = [makeTranscription()];
    state = reducer(state, addPersonaSpeaker("t1", "id-1"));
    state = reducer(state, addPersonaSpeaker("t1", "id-2"));
    expect(state[0].speakers[0].color).toBe(SPEAKER_PALETTE[0]);
    expect(state[0].speakers[1].color).toBe(SPEAKER_PALETTE[1]);
  });

  it("continues from the highest existing Persona N and ignores custom-named speakers", () => {
    const state = [
      makeTranscription({
        speakers: [{ id: "s1", label: "JFK", initials: "JF", color: "violet" }],
      }),
    ];
    const next = reducer(state, addPersonaSpeaker("t1", "new-id"));
    expect(next[0].speakers.find((s) => s.id === "new-id")?.label).toBe(
      "Persona 1",
    );
  });

  it("does not collide with an existing Persona label whose casing was changed", () => {
    const state = [
      makeTranscription({
        speakers: [
          {
            id: "s1",
            label: "persona 1",
            initials: "P1",
            color: "violet" as const,
          },
        ],
      }),
    ];

    const next = reducer(state, addPersonaSpeaker("t1", "new-id"));
    const labels = next[0].speakers.map((speaker) =>
      speaker.label.toLowerCase(),
    );

    expect(new Set(labels).size).toBe(labels.length);
    expect(
      next[0].speakers.find((speaker) => speaker.id === "new-id")?.label,
    ).toBe("Persona 2");
  });

  it("does not affect other transcriptions or mutate the input state", () => {
    const state = [
      makeTranscription(),
      makeTranscription({ id: "t2", speakers: [] }),
    ];
    const next = reducer(state, addPersonaSpeaker("t1", "id-1"));
    expect(next[1].speakers).toEqual([]);
    expect(state[0].speakers).toEqual([]);
  });

  // Sad path: there is no explicit "remove speaker" action in this reducer
  // today, so "the last person was deleted" reduces to an empty `speakers`
  // array for this action's purposes - it must still produce "Persona 1"
  // with the first palette color, not throw or divide by a stale count.
  it("sad path: creating a persona when speakers is empty still works", () => {
    const next = reducer(
      [makeTranscription({ speakers: [] })],
      addPersonaSpeaker("t1", "id-1"),
    );
    expect(next[0].speakers).toEqual([
      {
        id: "id-1",
        label: "Persona 1",
        initials: "P1",
        color: SPEAKER_PALETTE[0],
      },
    ]);
  });
});

// Criterion 3/5: identity is the `id` generated at creation, not the
// speaker's position or label - renaming/reordering/creating more personas
// must never reassign a turn's `speakerId`.
describe("addPersonaSpeaker — turn assignment stays stable by id", () => {
  const withOneTurn = () =>
    makeTranscription({
      turns: [
        {
          id: "turn1",
          speakerId: "placeholder",
          text: "x",
          startMs: 0,
          endMs: 1,
        },
      ],
    });

  it("a turn keeps pointing to the same speaker id after more personas are created", () => {
    let state = [withOneTurn()];
    state = reducer(state, addPersonaSpeaker("t1", "id-1"));
    state = reducer(state, reassignTurnSpeaker("t1", "turn1", "id-1"));
    state = reducer(state, addPersonaSpeaker("t1", "id-2"));
    state = reducer(state, addPersonaSpeaker("t1", "id-3"));

    expect(state[0].turns[0].speakerId).toBe("id-1");
    expect(state[0].speakers.map((s) => s.id)).toEqual([
      "id-1",
      "id-2",
      "id-3",
    ]);
  });

  it("renaming one persona does not reassign which speaker id a turn points to", () => {
    let state = [withOneTurn()];
    state = reducer(state, addPersonaSpeaker("t1", "id-1"));
    state = reducer(state, addPersonaSpeaker("t1", "id-2"));
    state = reducer(state, reassignTurnSpeaker("t1", "turn1", "id-2"));
    state = reducer(state, renameSpeakerGlobal("t1", "id-1", "Jueza"));

    // The identity assertion this test is actually about: the turn still
    // points to "id-2" by ID, regardless of what happened to "id-1"'s label.
    expect(state[0].turns[0].speakerId).toBe("id-2");
    // "Persona 2" (not "Persona 1"): `RENAME_SPEAKER_GLOBAL` no longer
    // renumbers remaining "Persona N" labels to stay contiguous after a
    // rename (G7 criterion 2 - see the removed `renumberPersonaSpeakers`
    // and its old call site's comment in index.ts). "id-2"'s own label is
    // therefore stable too, not just its id.
    expect(state[0].speakers.find((s) => s.id === "id-2")?.label).toBe(
      "Persona 2",
    );
  });
});

// Criterion 5, the "borrar otras" clause: `git grep -n 'REMOVE_SPEAKER\|
// DELETE_SPEAKER\|removeSpeaker\|deleteSpeaker'` (also run directly against
// the repo, not just this file) turns up nothing — there is no action or
// affordance anywhere that deletes a speaker. Enumerating this reducer's own
// `case`s confirms it: the only way a speaker disappears is the merge
// collapse inside `RENAME_SPEAKER_GLOBAL` (see the block above), which drops
// the RENAMED speaker and folds its turns into the one whose label it
// collided with — that's the "delete" this criterion has to be checked
// against, and it's deliberately excluded from THIS describe's assertions:
// it's the point of the merge, not a bystander surviving it.
// "Otras" in the criterion means a THIRD speaker uninvolved in the merge:
// with three speakers holding turns, colliding two of them must leave the
// third's `speakerId` and displayed label completely untouched.
describe("addPersonaSpeaker — a bystander survives a merge-collision delete (criterion 5)", () => {
  it("a third speaker's turn keeps its speakerId and label when two OTHER speakers merge", () => {
    const state = [
      makeTranscription({
        speakers: [
          {
            id: "s1",
            label: "Persona 1",
            initials: "P1",
            color: "violet" as const,
          },
          {
            id: "s2",
            label: "Persona 2",
            initials: "P2",
            color: "green" as const,
          },
          {
            id: "s3",
            label: "Persona 3",
            initials: "P3",
            color: "red" as const,
          },
        ],
        turns: [
          { id: "turn1", speakerId: "s1", text: "a", startMs: 0, endMs: 100 },
          {
            id: "turn2",
            speakerId: "s2",
            text: "b",
            startMs: 100,
            endMs: 200,
          },
          {
            id: "turn3",
            speakerId: "s3",
            text: "c",
            startMs: 200,
            endMs: 300,
          },
        ],
      }),
    ];

    // s1 renamed to "Persona 2" collides with s2 -> s1 is dropped and its
    // turn folds into s2. Deliberately NOT asserted here (that's what the
    // merge exists to do, and T1's merge-collision test already covers it):
    // turn1 no longer points to s1.
    const next = reducer(state, renameSpeakerGlobal("t1", "s1", "Persona 2"));
    const speakers = next[0].speakers;
    const turns = next[0].turns;

    // The bystander: s3 and turn3 are untouched by a merge between s1 and s2.
    expect(speakers.find((s) => s.id === "s3")).toMatchObject({
      id: "s3",
      label: "Persona 3",
    });
    expect(turns.find((t) => t.id === "turn3")?.speakerId).toBe("s3");
  });

  // The other two clauses of criterion 5 ("crear otras personas" and
  // "renombrar otras") are already exercised at this reducer level by the
  // "addPersonaSpeaker — turn assignment stays stable by id" block above
  // (T1) — not duplicated here. See turn-side-panel.test.tsx for the
  // component-level test of those two clauses, which had no coverage yet.
});
