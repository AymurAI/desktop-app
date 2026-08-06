import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
  beforeEach(() => dispatch.mockClear());

  it("starts a fresh Persona count at 1 when the only speaker was renamed away from Persona N", () => {
    // Regression: renaming the sole "Persona 1" to a custom name (e.g. "JFK")
    // must not make the next auto-generated speaker "Persona 2" just because
    // `speakers.length` is 1 — there are zero Persona-N speakers left.
    const renamedOnly: Transcription = {
      ...transcription,
      speakers: [{ id: "s1", label: "JFK", initials: "JF", color: "violet" }],
    };
    render(<TurnSidePanel transcription={renamedOnly} activeTurnId="a" />);
    fireEvent.click(screen.getByText("Nuevo"));
    fireEvent.click(screen.getByRole("button", { name: "Nueva persona" }));

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "ADD_SPEAKER",
        payload: expect.objectContaining({
          speaker: expect.objectContaining({ label: "Persona 1" }),
        }),
      }),
    );
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
      <TurnSidePanel transcription={withCustomAndPersona} activeTurnId="a" />,
    );
    fireEvent.click(screen.getByText("Nuevo"));
    fireEvent.click(screen.getByRole("button", { name: "Nueva persona" }));

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "ADD_SPEAKER",
        payload: expect.objectContaining({
          speaker: expect.objectContaining({ label: "Persona 2" }),
        }),
      }),
    );
  });
});

describe("TurnSidePanel role options menu", () => {
  beforeEach(() => dispatch.mockClear());

  it("lists only the roles whose label is not already taken", () => {
    const withFiscal: Transcription = {
      ...multiSpeakerTranscription,
      speakers: [
        { id: "s1", label: "Persona 1", initials: "P1", color: "violet" },
        { id: "s2", label: "Fiscal", initials: "FI", color: "green" },
      ],
    };
    render(<TurnSidePanel transcription={withFiscal} activeTurnId="a" />);
    fireEvent.click(screen.getByText("Nuevo"));

    expect(screen.getByRole("button", { name: "Juez/a" })).toBeTruthy();
    // "Fiscal" ya existe como orador: aparece como pill, no como opción.
    expect(screen.queryByRole("button", { name: "Fiscal" })).toBeNull();
  });

  it("creates the speaker and reassigns when the current speaker has a single turn", () => {
    render(
      <TurnSidePanel
        transcription={multiSpeakerTranscription}
        activeTurnId="b" // "b" es el único turno de s2
      />,
    );
    fireEvent.click(screen.getByText("Nuevo"));
    fireEvent.click(screen.getByRole("button", { name: "Juez/a" }));

    expect(screen.queryByText("sidePanel.scopeDialog.title")).toBeNull();
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "ADD_SPEAKER",
        payload: expect.objectContaining({
          speaker: expect.objectContaining({ label: "Juez/a" }),
        }),
      }),
    );
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "REASSIGN_TURN_SPEAKER",
        payload: expect.objectContaining({ turnId: "b" }),
      }),
    );
  });

  it("prompts for scope when picking a role for a speaker with several turns", () => {
    render(
      <TurnSidePanel
        transcription={multiSpeakerTranscription}
        activeTurnId="a" // s1 tiene los turnos a y c
      />,
    );
    fireEvent.click(screen.getByText("Nuevo"));
    fireEvent.click(screen.getByRole("button", { name: "Juez/a" }));

    expect(screen.getByText("sidePanel.scopeDialog.title")).toBeTruthy();
    fireEvent.click(screen.getByText("sidePanel.scopeDialog.allTurns"));
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "RENAME_SPEAKER_GLOBAL",
        payload: expect.objectContaining({
          speakerId: "s1",
          newLabel: "Juez/a",
        }),
      }),
    );
  });

  it("does not dispatch when the already-current speaker's pill is clicked", () => {
    render(
      <TurnSidePanel
        transcription={multiSpeakerTranscription}
        activeTurnId="a"
      />,
    );
    // "Persona 1" also appears in the "Turno seleccionado" header (it always
    // shows the current speaker's name), so getAllByText + the pill instance
    // (index 1) is used to disambiguate from the header (index 0).
    fireEvent.click(screen.getAllByText("Persona 1")[1]); // s1 ya es el orador del turno "a"
    expect(dispatch).not.toHaveBeenCalled();
  });
});
