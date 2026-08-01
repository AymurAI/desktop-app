import { act, fireEvent, render, screen } from "@testing-library/react";
import { useReducer } from "react";
import { describe, expect, it, vi } from "vitest";

import reducer from "@/reducers/transcription";
import type { Transcription } from "@/types/transcription";
import SpeakerPicker from "./speaker-picker";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const dispatch = vi.fn();
vi.mock("@/hooks/useTranscriptions", () => ({
  useTranscriptionDispatch: () => dispatch,
}));

const initial: Transcription = {
  id: "doc-1",
  title: "T",
  audioFileName: "a.mp3",
  audioDurationMs: 1000,
  audioObjectUrl: "blob:x",
  speakers: [
    { id: "seed", label: "Persona 1", initials: "P1", color: "violet" },
  ],
  turns: [
    {
      id: "turn-1",
      speakerId: "seed",
      text: "uno",
      startMs: 0,
      endMs: 1000,
    },
  ],
  source: "asr",
  createdAt: "2026-01-01T00:00:00.000Z",
};

function RealReducerHarness() {
  const [state, dispatchReal] = useReducer(reducer, [initial]);
  dispatch.mockImplementation(dispatchReal);

  return (
    <>
      <div data-testid="debug-speakers" style={{ display: "none" }}>
        {JSON.stringify(state[0].speakers)}
      </div>
      <SpeakerPicker
        transcription={state[0]}
        currentSpeakerId="seed"
        onPick={() => {}}
        onClose={() => {}}
      />
    </>
  );
}

describe("SpeakerPicker person creation", () => {
  it("does not create duplicate speakers when the create button is clicked twice in one batch", () => {
    render(<RealReducerHarness />);

    fireEvent.click(screen.getByText("speakerPicker.newPerson"));
    fireEvent.change(
      screen.getByPlaceholderText("speakerPicker.newPersonPlaceholder"),
      { target: { value: "Fiscal" } },
    );

    const createButton = screen.getByText("speakerPicker.create");
    act(() => {
      createButton.click();
      createButton.click();
    });

    const speakers = JSON.parse(
      screen.getByTestId("debug-speakers").textContent ?? "[]",
    ) as Array<{ label: string }>;
    const labels = speakers.map((speaker) => speaker.label.toLowerCase());

    expect(new Set(labels).size).toBe(labels.length);
  });
});
