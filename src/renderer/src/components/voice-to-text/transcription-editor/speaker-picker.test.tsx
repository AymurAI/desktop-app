import { act, fireEvent, render, screen } from "@testing-library/react";
import { useReducer } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

const transcription: Transcription = {
  id: "doc-1",
  title: "T",
  audioFileName: "a.mp3",
  audioDurationMs: 30_000,
  audioObjectUrl: "blob:x",
  speakers: [
    { id: "s1", label: "Persona 1", initials: "P1", color: "violet" },
    { id: "s2", label: "Persona 2", initials: "P2", color: "green" },
  ],
  turns: [],
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

    fireEvent.click(screen.getByRole("button", { name: "speakerPicker.new" }));
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

describe("SpeakerPicker", () => {
  beforeEach(() => dispatch.mockClear());

  it("step 1 lists identified speakers with the current one marked selected", () => {
    render(
      <SpeakerPicker
        transcription={transcription}
        currentSpeakerId="s2"
        onPick={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Persona 1" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Persona 2" })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  it("picking an existing speaker calls onPick with its id and closes", () => {
    const onPick = vi.fn();
    const onClose = vi.fn();
    render(
      <SpeakerPicker
        transcription={transcription}
        currentSpeakerId="s2"
        onPick={onPick}
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Persona 1" }));
    expect(onPick).toHaveBeenCalledWith("s1");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("'Nuevo' advances to the roles step", () => {
    render(
      <SpeakerPicker
        transcription={transcription}
        currentSpeakerId="s1"
        onPick={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "speakerPicker.new" }));
    expect(screen.getByRole("button", { name: "Juez/a" })).toBeInTheDocument();
  });

  it("picking a role creates the speaker and calls onPick with its new id", () => {
    const onPick = vi.fn();
    render(
      <SpeakerPicker
        transcription={transcription}
        currentSpeakerId="s1"
        onPick={onPick}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "speakerPicker.new" }));
    fireEvent.click(screen.getByRole("button", { name: "Fiscal" }));

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "ADD_SPEAKER",
        payload: expect.objectContaining({
          speaker: expect.objectContaining({ label: "Fiscal" }),
        }),
      }),
    );
    expect(onPick).toHaveBeenCalledTimes(1);
  });

  it("'Nueva persona' reveals a free-text input, and Enter creates and picks it", () => {
    const onPick = vi.fn();
    render(
      <SpeakerPicker
        transcription={transcription}
        currentSpeakerId="s1"
        onPick={onPick}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "speakerPicker.new" }));
    fireEvent.click(
      screen.getByRole("button", { name: "speakerPicker.newPerson" }),
    );
    const input = screen.getByPlaceholderText(
      "speakerPicker.newPersonPlaceholder",
    );
    fireEvent.change(input, { target: { value: "Dra. Silva" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "ADD_SPEAKER",
        payload: expect.objectContaining({
          speaker: expect.objectContaining({ label: "Dra. Silva" }),
        }),
      }),
    );
    expect(onPick).toHaveBeenCalledTimes(1);
  });
});
