import { act, fireEvent, render, screen } from "@testing-library/react";
import { useReducer } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import reducer, { computeInitials } from "@/reducers/transcription";
import sampleTranscript from "@/services/aymurai/fixtures/sampleDeepgramTranscription.json";
import type { Transcription } from "@/types/transcription";
import TurnSidePanel, { getTimestampBounds } from "./turn-side-panel";

vi.stubGlobal(
  "ResizeObserver",
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const dispatch = vi.fn();
vi.mock("@/hooks/useTranscriptions", () => ({
  useTranscriptionDispatch: () => dispatch,
}));

const showToast = vi.fn();
vi.mock("@/features/showToast", () => ({
  showToast: (...args: unknown[]) => showToast(...args),
}));

/**
 * G7 F4 (tasks/responsive-fixes/issues/G7-modo-edicion-personas.md): the
 * module-level `dispatch` mock above is a bare `vi.fn()` - state never
 * advances, so a "+ Nuevo" race test written against it is vacuous FOR A
 * DIFFERENT REASON than the bug: every dispatched action sees the SAME
 * initial `speakers` regardless of whether the derivation lives in the
 * component or the reducer, so N clicks would produce N identical labels
 * with or without the fix. Routes the shared `dispatch` mock to the REAL
 * production reducer instead, via `useReducer`, so state genuinely
 * accumulates across dispatches - this is what makes the race test below
 * capable of failing.
 *
 * A hidden JSON dump of the current speakers is the simplest way for a test
 * to read back derived fields (label/initials/color) that `ADD_PERSONA_
 * SPEAKER`'s payload no longer carries (it only carries `id` - the whole
 * point of the fix is that those fields are computed BY the reducer).
 */
function RealReducerHarness({
  initial,
  activeTurnId,
}: {
  initial: Transcription;
  activeTurnId: string | null;
}) {
  const [state, dispatchReal] = useReducer(reducer, [initial]);
  dispatch.mockImplementation(dispatchReal);
  return (
    <>
      <div data-testid="debug-speakers" style={{ display: "none" }}>
        {JSON.stringify(state[0].speakers)}
      </div>
      <div data-testid="debug-turns" style={{ display: "none" }}>
        {JSON.stringify(state[0].turns)}
      </div>
      <TurnSidePanel transcription={state[0]} activeTurnId={activeTurnId} />
    </>
  );
}

const transcription: Transcription = {
  id: "doc-1",
  title: "T",
  audioFileName: "a.mp3",
  audioDurationMs: 30_000,
  audioObjectUrl: "blob:x",
  speakers: [
    { id: "s1", label: "Persona 1", initials: "P1", color: "primary" },
  ],
  turns: [
    { id: "a", speakerId: "s1", text: "uno", startMs: 5000, endMs: 8000 },
    { id: "b", speakerId: "s1", text: "dos", startMs: 15000, endMs: 20000 },
    { id: "c", speakerId: "s1", text: "tres", startMs: 20000, endMs: 25000 },
  ],
  source: "asr",
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("getTimestampBounds", () => {
  it("bounds a middle turn between the previous turn's start and the next turn's start", () => {
    const { minMs, maxMs } = getTimestampBounds(
      transcription.turns,
      1,
      transcription.audioDurationMs,
    );
    expect(minMs).toBe(5001); // just after turn "a"'s startMs (5000)
    expect(maxMs).toBe(20000); // turn "c"'s startMs
  });

  it("bounds the first turn between 0 and the next turn's start", () => {
    const { minMs, maxMs } = getTimestampBounds(
      transcription.turns,
      0,
      transcription.audioDurationMs,
    );
    expect(minMs).toBe(0);
    expect(maxMs).toBe(15000);
  });

  it("bounds the last turn up to the audio's total duration", () => {
    const { minMs, maxMs } = getTimestampBounds(
      transcription.turns,
      2,
      transcription.audioDurationMs,
    );
    expect(minMs).toBe(15001);
    expect(maxMs).toBe(30_000);
  });
});

describe("TurnSidePanel timestamp editing", () => {
  beforeEach(() => {
    dispatch.mockClear();
    showToast.mockClear();
  });

  it("rejects a timestamp outside the [previous, next) range and shows a toast instead of dispatching", () => {
    render(<TurnSidePanel transcription={transcription} activeTurnId="b" />);
    const input = screen.getByLabelText("Marca de tiempo");
    fireEvent.change(input, { target: { value: "00:30" } }); // 30s, past "c" at 20s
    expect(dispatch).not.toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith(
      "sidePanel.timestampOutOfRange",
      "warning",
    );
  });

  it("accepts and dispatches a timestamp within the valid range", () => {
    render(<TurnSidePanel transcription={transcription} activeTurnId="b" />);
    const input = screen.getByLabelText("Marca de tiempo");
    fireEvent.change(input, { target: { value: "00:16" } }); // 16s, between "a" and "c"
    expect(showToast).not.toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledTimes(1);
  });
});

describe("TurnSidePanel add-below", () => {
  beforeEach(() => {
    dispatch.mockClear();
    showToast.mockClear();
  });

  it("inserts a turn with a real (non-zero) duration that fits the gap to the next turn", () => {
    render(<TurnSidePanel transcription={transcription} activeTurnId="a" />);
    fireEvent.click(screen.getByText("Agregar debajo"));

    expect(dispatch).toHaveBeenCalledTimes(1);
    const action = dispatch.mock.calls[0][0];
    expect(action.payload.turn.startMs).toBe(8000); // turn "a"'s endMs
    expect(action.payload.turn.endMs).toBeGreaterThan(
      action.payload.turn.startMs,
    );
    // Capped within the gap to turn "b" (starts at 15000) — doesn't overlap it.
    expect(action.payload.turn.endMs).toBeLessThanOrEqual(15000);
  });

  it("falls back to a default duration when there is no next turn", () => {
    const lastTurnOnly: Transcription = {
      ...transcription,
      turns: [transcription.turns[transcription.turns.length - 1]],
    };
    render(<TurnSidePanel transcription={lastTurnOnly} activeTurnId="c" />);
    fireEvent.click(screen.getByText("Agregar debajo"));

    const action = dispatch.mock.calls[0][0];
    expect(action.payload.turn.startMs).toBe(25000); // turn "c"'s endMs
    expect(action.payload.turn.endMs).toBe(27000); // + 2000ms default
  });
});

const multiSpeakerTranscription: Transcription = {
  ...transcription,
  speakers: [
    { id: "s1", label: "Persona 1", initials: "P1", color: "violet" },
    { id: "s2", label: "Persona 2", initials: "P2", color: "green" },
  ],
  turns: [
    { id: "a", speakerId: "s1", text: "uno", startMs: 0, endMs: 10_000 },
    { id: "b", speakerId: "s2", text: "dos", startMs: 10_000, endMs: 20_000 },
    { id: "c", speakerId: "s1", text: "tres", startMs: 20_000, endMs: 30_000 },
  ],
};

describe("TurnSidePanel speaker identity editing", () => {
  beforeEach(() => dispatch.mockClear());

  it("dispatches a unique global rename for an existing speaker", () => {
    render(
      <TurnSidePanel
        transcription={multiSpeakerTranscription}
        activeTurnId="a"
      />,
    );

    expect(screen.getAllByLabelText("Renombrar")).toHaveLength(2);
    fireEvent.click(screen.getAllByLabelText("Renombrar")[0]);
    const input = screen.getByLabelText("Editar nombre de Persona 1");
    fireEvent.change(input, { target: { value: "Jueza" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "RENAME_SPEAKER_GLOBAL",
        payload: expect.objectContaining({
          speakerId: "s1",
          newLabel: "Jueza",
        }),
      }),
    );
  });

  it("only merges colliding identities after confirmation and supports cancel", () => {
    render(
      <TurnSidePanel
        transcription={multiSpeakerTranscription}
        activeTurnId="a"
      />,
    );

    const startCollision = () => {
      fireEvent.click(screen.getAllByLabelText("Renombrar")[0]);
      const input = screen.getByLabelText("Editar nombre de Persona 1");
      fireEvent.change(input, { target: { value: "Persona 2" } });
      fireEvent.keyDown(input, { key: "Enter" });
    };

    startCollision();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(dispatch).not.toHaveBeenCalled();

    startCollision();
    fireEvent.click(screen.getByRole("button", { name: "Combinar" }));
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "RENAME_SPEAKER_GLOBAL",
        payload: expect.objectContaining({
          speakerId: "s1",
          newLabel: "Persona 2",
        }),
      }),
    );
  });
});

describe("TurnSidePanel adjacent turn merging", () => {
  beforeEach(() => dispatch.mockClear());

  it("merges same-speaker adjacent turns without confirmation", () => {
    render(<TurnSidePanel transcription={transcription} activeTurnId="b" />);
    fireEvent.click(screen.getByText("Unir con el siguiente"));
    expect(screen.queryByRole("button", { name: "Combinar" })).toBeNull();
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: "MERGE_TURN_WITH_NEXT" }),
    );
  });

  it("confirms a different-speaker merge with the previous turn", () => {
    render(
      <TurnSidePanel
        transcription={multiSpeakerTranscription}
        activeTurnId="b"
      />,
    );
    fireEvent.click(screen.getByText("Unir con el anterior"));
    expect(screen.getByText(/persona del turno anterior/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Combinar" }));
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: "MERGE_TURN_WITH_PREVIOUS" }),
    );
  });

  it("cancels a different-speaker merge with the next turn", () => {
    render(
      <TurnSidePanel
        transcription={multiSpeakerTranscription}
        activeTurnId="b"
      />,
    );
    fireEvent.click(screen.getByText("Unir con el siguiente"));
    expect(screen.getByText(/persona del turno siguiente/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(dispatch).not.toHaveBeenCalled();
  });
});

describe("TurnSidePanel bulk-apply scope prompt", () => {
  beforeEach(() => dispatch.mockClear());

  it("applies immediately with no prompt when the current speaker has only one turn", () => {
    render(
      <TurnSidePanel
        transcription={multiSpeakerTranscription}
        activeTurnId="b" // "b" is s2's only turn
      />,
    );
    fireEvent.click(screen.getByText("Persona 1")); // pill for s1, a different speaker
    expect(screen.queryByText("sidePanel.scopeDialog.title")).toBeNull();
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "REASSIGN_TURN_SPEAKER",
        payload: expect.objectContaining({ turnId: "b", newSpeakerId: "s1" }),
      }),
    );
  });

  it("prompts for scope when the current speaker has more than one turn, and applies to this turn only on choice", () => {
    render(
      <TurnSidePanel
        transcription={multiSpeakerTranscription}
        activeTurnId="a" // "a" is one of s1's two turns (a, c)
      />,
    );
    fireEvent.click(screen.getByText("Persona 2")); // pill for s2, a different speaker
    expect(screen.getByText("sidePanel.scopeDialog.title")).toBeTruthy();

    fireEvent.click(screen.getByText("sidePanel.scopeDialog.thisTurnOnly"));
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "REASSIGN_TURN_SPEAKER",
        payload: expect.objectContaining({ turnId: "a", newSpeakerId: "s2" }),
      }),
    );
    expect(screen.queryByText("sidePanel.scopeDialog.title")).toBeNull();
  });

  it("applies to all of the current speaker's turns when that scope is chosen", () => {
    render(
      <TurnSidePanel
        transcription={multiSpeakerTranscription}
        activeTurnId="a"
      />,
    );
    fireEvent.click(screen.getByText("Persona 2"));
    fireEvent.click(screen.getByText("sidePanel.scopeDialog.allTurns"));

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "RENAME_SPEAKER_GLOBAL",
        payload: expect.objectContaining({
          speakerId: "s1",
          newLabel: "Persona 2",
        }),
      }),
    );
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: "REASSIGN_TURN_SPEAKER" }),
    );
  });

  it("dismisses without dispatching on cancel", () => {
    render(
      <TurnSidePanel
        transcription={multiSpeakerTranscription}
        activeTurnId="a"
      />,
    );
    fireEvent.click(screen.getByText("Persona 2"));
    fireEvent.click(screen.getByText("sidePanel.scopeDialog.cancel"));
    expect(dispatch).not.toHaveBeenCalled();
  });
});

describe("TurnSidePanel new-person numbering", () => {
  // G7 F4: `handleNewPerson` no longer computes the label itself - it
  // dispatches `ADD_PERSONA_SPEAKER` with only `{transcriptionId, id}`, and
  // the reducer derives the label. So verifying "which label did it pick"
  // now requires the REAL reducer behind dispatch (RealReducerHarness),
  // not an assertion on the dispatched action's payload (which no longer
  // carries a label at all).
  beforeEach(() => dispatch.mockClear());
  afterEach(() => dispatch.mockReset());

  it("starts a fresh Persona count at 1 when the only speaker was renamed away from Persona N", () => {
    // Regression: renaming the sole "Persona 1" to a custom name (e.g. "JFK")
    // must not make the next auto-generated speaker "Persona 2" just because
    // `speakers.length` is 1 — there are zero Persona-N speakers left.
    const renamedOnly: Transcription = {
      ...transcription,
      speakers: [{ id: "s1", label: "JFK", initials: "JF", color: "violet" }],
    };
    render(<RealReducerHarness initial={renamedOnly} activeTurnId="a" />);
    fireEvent.click(screen.getByText("Nuevo"));

    const speakers = JSON.parse(
      screen.getByTestId("debug-speakers").textContent ?? "[]",
    );
    expect(speakers).toHaveLength(2);
    expect(speakers[1].label).toBe("Persona 1");
  });

  it("continues from the highest existing Persona N, not from the total speaker count", () => {
    const withCustomAndPersona: Transcription = {
      ...transcription,
      speakers: [
        { id: "s1", label: "JFK", initials: "JF", color: "violet" },
        { id: "s2", label: "Persona 1", initials: "P1", color: "green" },
      ],
      turns: [
        { id: "a", speakerId: "s1", text: "uno", startMs: 5000, endMs: 8000 },
      ],
    };
    render(
      <RealReducerHarness initial={withCustomAndPersona} activeTurnId="a" />,
    );
    fireEvent.click(screen.getByText("Nuevo"));

    const speakers = JSON.parse(
      screen.getByTestId("debug-speakers").textContent ?? "[]",
    );
    expect(speakers).toHaveLength(3);
    expect(speakers[2].label).toBe("Persona 2");
  });
});

// G7 F4, criterion 1 (with the CORRECTED test shape the ticket calls for):
// N clicks on "+ Nuevo" within the same React batch must produce N speakers
// with N distinct labels AND N distinct colors.
//
// NOT `fireEvent.click`: Testing Library wraps EACH `fireEvent` call in its
// own `act()`, which flushes React's pending state before the next call -
// so four un-awaited `fireEvent.click()` calls each run against the
// PREVIOUSLY COMMITTED state and produce four distinct labels even WITH the
// bug present (i.e. even with the old component-side derivation from a
// stale `speakers` prop). That is exactly the false-negative this test
// exists to avoid, one level up from the bug itself. Four raw DOM
// `.click()` calls inside a SINGLE `act()` do not get an intermediate
// flush - all four invoke the SAME pre-click render's `handleNewPerson`
// closure before React commits, which is the actual race a user causes by
// clicking "+ Nuevo" rapidly.
describe("TurnSidePanel new-person race (F4)", () => {
  afterEach(() => dispatch.mockReset());

  it("N rapid clicks in the same batch produce N speakers with distinct labels and colors", () => {
    // Needs one PRE-EXISTING speaker matching the active turn: with zero
    // speakers, `currentSpeaker` resolves to null and the whole panel
    // (including "+ Nuevo") renders the empty-panel placeholder instead -
    // that state is only reachable/testable at the reducer level (see
    // reducers/transcription/index.test.ts's own empty-speakers case).
    const initial: Transcription = {
      ...transcription,
      speakers: [
        { id: "seed", label: "Persona 1", initials: "P1", color: "violet" },
      ],
      turns: [
        {
          id: "a",
          speakerId: "seed",
          text: "uno",
          startMs: 0,
          endMs: 1000,
        },
      ],
    };

    render(<RealReducerHarness initial={initial} activeTurnId="a" />);
    const button = screen.getByText("Nuevo");

    act(() => {
      button.click();
      button.click();
      button.click();
      button.click();
    });

    const speakers = JSON.parse(
      screen.getByTestId("debug-speakers").textContent ?? "[]",
    );
    // The 1 seed speaker plus 4 newly-created ones.
    expect(speakers).toHaveLength(5);
    const created = speakers.slice(1);
    expect(created.map((s: { label: string }) => s.label)).toEqual([
      "Persona 2",
      "Persona 3",
      "Persona 4",
      "Persona 5",
    ]);
    expect(new Set(created.map((s: { label: string }) => s.label)).size).toBe(
      4,
    );
    expect(new Set(created.map((s: { color: string }) => s.color)).size).toBe(
      4,
    );
  });
});

// Sad paths (G7 F4).
describe("TurnSidePanel new-person sad paths", () => {
  beforeEach(() => dispatch.mockClear());
  afterEach(() => dispatch.mockReset());

  it('"+ Nuevo" is not reachable when there is no active turn (renders the empty panel instead)', () => {
    render(
      <TurnSidePanel
        transcription={transcription}
        activeTurnId="does-not-exist"
      />,
    );
    expect(screen.getByTestId("vtt-side-panel")).toBeInTheDocument();
    expect(screen.queryByText("Nuevo")).toBeNull();
    expect(dispatch).not.toHaveBeenCalled();
  });

  // There is no explicit "remove speaker" action in this reducer today, so
  // "the last person was deleted" reduces to an empty `speakers` array for
  // `ADD_PERSONA_SPEAKER`'s purposes. That case can't be driven through
  // THIS component, though: with zero speakers, `currentSpeaker` resolves
  // to null and the panel never renders its body (or "+ Nuevo") at all -
  // see the "no active turn" case just above, which hits the same early
  // return for a different reason. Covered directly at the reducer level
  // instead: reducers/transcription/index.test.ts's "sad path: creating a
  // persona when speakers is empty still works".
  it("documents why the empty-speakers sad path is a reducer-level test, not a component one", () => {
    const noSpeakers: Transcription = {
      ...transcription,
      speakers: [],
    };
    render(<TurnSidePanel transcription={noSpeakers} activeTurnId="a" />);
    expect(screen.getByTestId("vtt-side-panel")).toBeInTheDocument();
    expect(screen.getByText("sidePanel.empty")).toBeInTheDocument();
    expect(screen.queryByText("Nuevo")).toBeNull();
  });
});

// Criterion 5 (this component's half of it — the reducer-level half is
// already covered by "addPersonaSpeaker — turn assignment stays stable by
// id" in reducers/transcription/index.test.ts, T1): a turn already assigned
// to a speaker must keep pointing to that same `speakerId`, with that same
// speaker's label unchanged, after OTHER personas are created and renamed
// through this component's own UI. "Nuevo" reassigns the CURRENTLY ACTIVE
// turn to the persona it creates (see `handleNewPerson`), so the turn this
// test watches is deliberately a different, non-active one — otherwise
// "create others" would trivially reassign the very turn under test.
describe("TurnSidePanel — a bystander speaker survives creates and renames (criterion 5)", () => {
  it("a turn keeps its speakerId and label after other personas are created and renamed", () => {
    const initial: Transcription = {
      ...transcription,
      speakers: [
        { id: "s-active", label: "Persona 1", initials: "P1", color: "violet" },
        {
          id: "s-bystander",
          label: "Persona 2",
          initials: "P2",
          color: "green",
        },
      ],
      turns: [
        {
          id: "active-turn",
          speakerId: "s-active",
          text: "uno",
          startMs: 0,
          endMs: 1000,
        },
        {
          id: "watched-turn",
          speakerId: "s-bystander",
          text: "dos",
          startMs: 1000,
          endMs: 2000,
        },
      ],
    };

    render(<RealReducerHarness initial={initial} activeTurnId="active-turn" />);

    // Create two more personas (assigned to the active turn, not the
    // watched one) and rename one of THEM — never the bystander.
    fireEvent.click(screen.getByText("Nuevo"));
    fireEvent.click(screen.getByText("Nuevo"));

    fireEvent.click(screen.getAllByLabelText("Renombrar")[2]);
    const input = screen.getByLabelText("Editar nombre de Persona 3");
    fireEvent.change(input, { target: { value: "Testigo" } });
    fireEvent.keyDown(input, { key: "Enter" });

    const speakers = JSON.parse(
      screen.getByTestId("debug-speakers").textContent ?? "[]",
    );
    const turns = JSON.parse(
      screen.getByTestId("debug-turns").textContent ?? "[]",
    );

    expect(
      speakers.find((s: { id: string }) => s.id === "s-bystander"),
    ).toMatchObject({
      id: "s-bystander",
      label: "Persona 2",
    });
    expect(
      turns.find((t: { id: string }) => t.id === "watched-turn")?.speakerId,
    ).toBe("s-bystander");
  });
});

// G7 criterion 4 (tasks/responsive-fixes/issues/G7-modo-edicion-personas.md):
// with 12 speakers, each must get a distinct badge - before the fix,
// "Locutor 1", "Locutor 10" and "Locutor 11" all rendered "L1". The fixture
// already models this exact three-way collision (`Locutor 1`/`10`/`11`), so
// it's used as the vehicle (labels/ids/colors) instead of synthesizing 12
// personas - but `initials` is recomputed here via the real
// `computeInitials`, not read back from the fixture's own stored field, so
// this test actually exercises the production function instead of just
// re-displaying whatever the JSON happens to say.
describe("TurnSidePanel — 12 distinct persona badges (criterion 4)", () => {
  it("renders 12 distinct initials, with no collision between Locutor 1/10/11", () => {
    const fixtureSpeakers =
      sampleTranscript.speakers as Transcription["speakers"];
    const twelveSpeakers = fixtureSpeakers.map((s) => ({
      ...s,
      initials: computeInitials(s.label),
    }));
    const withTwelve: Transcription = {
      ...transcription,
      speakers: twelveSpeakers,
      turns: [
        {
          id: "a",
          speakerId: twelveSpeakers[0].id,
          text: "uno",
          startMs: 0,
          endMs: 1000,
        },
      ],
    };

    render(<TurnSidePanel transcription={withTwelve} activeTurnId="a" />);

    expect(new Set(twelveSpeakers.map((s) => s.initials)).size).toBe(12);
    for (const s of twelveSpeakers) {
      expect(screen.getAllByText(s.initials).length).toBeGreaterThan(0);
    }
    expect(screen.getByText("L10")).toBeInTheDocument();
    expect(screen.getByText("L11")).toBeInTheDocument();
    // Exactly one badge reads "L1" - Locutor 1's own, not shared with 10/11.
    expect(screen.getAllByText("L1")).toHaveLength(1);
  });
});
