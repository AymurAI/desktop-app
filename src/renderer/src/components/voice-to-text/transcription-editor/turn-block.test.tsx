import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Speaker, Transcription, Turn } from "@/types/transcription";
import TurnBlock from "./turn-block";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("@/hooks/useTranscriptions", () => ({
  useTranscriptionDispatch: () => vi.fn(),
}));

const speaker: Speaker = {
  id: "s1",
  label: "Persona 1",
  initials: "P1",
  color: "primary",
};

const turn: Turn = {
  id: "t1",
  speakerId: "s1",
  text: "hola mundo",
  startMs: 1500,
  endMs: 3000,
};

const transcription: Transcription = {
  id: "doc-1",
  title: "T",
  audioFileName: "a.mp3",
  audioDurationMs: 5000,
  audioObjectUrl: "blob:x",
  speakers: [speaker],
  turns: [turn],
  source: "asr",
  createdAt: "2026-01-01T00:00:00.000Z",
};

function renderBlock(
  overrides: Partial<React.ComponentProps<typeof TurnBlock>> = {},
) {
  const onSeekTo = vi.fn();
  const onSelect = vi.fn();
  const onTextSelect = vi.fn();
  const onEditingFocusChange = vi.fn();
  render(
    <TurnBlock
      turn={turn}
      speaker={speaker}
      transcription={transcription}
      isActive={false}
      isEditMode={true}
      isSelected={false}
      isEditing={false}
      searchQuery=""
      onSeekTo={onSeekTo}
      onSelect={onSelect}
      onTextSelect={onTextSelect}
      onEditingFocusChange={onEditingFocusChange}
      {...overrides}
    />,
  );
  return { onSeekTo, onSelect, onTextSelect, onEditingFocusChange };
}

describe("TurnBlock click-to-seek in edit mode", () => {
  it("seeks and selects exactly once when the speaker/timestamp header is clicked (no double-fire via bubbling)", () => {
    const { onSeekTo, onSelect } = renderBlock();
    fireEvent.click(screen.getByText("Persona 1"));
    expect(onSeekTo).toHaveBeenCalledTimes(1);
    expect(onSeekTo).toHaveBeenCalledWith(1500);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("t1");
  });

  it("seeks and selects when the editable text body is clicked", () => {
    const { onSeekTo, onSelect } = renderBlock();
    fireEvent.click(screen.getByRole("textbox"));
    expect(onSeekTo).toHaveBeenCalledWith(1500);
    expect(onSelect).toHaveBeenCalledWith("t1");
  });

  it("does not re-seek when clicking the text of an already-selected block (just caret placement while editing)", () => {
    const { onSeekTo, onSelect } = renderBlock({ isSelected: true });
    fireEvent.click(screen.getByRole("textbox"));
    expect(onSeekTo).not.toHaveBeenCalled();
    expect(onSelect).toHaveBeenCalledWith("t1");
  });

  it("still seeks from the header even when the block is already selected", () => {
    const { onSeekTo } = renderBlock({ isSelected: true });
    fireEvent.click(screen.getByText("Persona 1"));
    expect(onSeekTo).toHaveBeenCalledWith(1500);
  });

  it("does not re-seek when clicking the text of a block being edited via keyboard focus (isEditing, not isSelected)", () => {
    // A turn reached by Tab (keyboard focus) sets isEditing but never
    // isSelected — the guard must still cover it, or the first click after
    // tabbing in would incorrectly jump playback back to the block's start.
    const { onSeekTo, onSelect } = renderBlock({
      isSelected: false,
      isEditing: true,
    });
    fireEvent.click(screen.getByRole("textbox"));
    expect(onSeekTo).not.toHaveBeenCalled();
    expect(onSelect).toHaveBeenCalledWith("t1");
  });

  it("does not seek/select on wrap click when isEditMode is false", () => {
    const { onSeekTo, onSelect } = renderBlock({ isEditMode: false });
    fireEvent.click(screen.getByText("hola mundo"));
    expect(onSeekTo).not.toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("notifies focus changes so the parent can pause auto-scroll while editing", () => {
    const { onEditingFocusChange } = renderBlock();
    const textbox = screen.getByRole("textbox");
    fireEvent.focus(textbox);
    expect(onEditingFocusChange).toHaveBeenCalledWith("t1", true);
    fireEvent.blur(textbox);
    expect(onEditingFocusChange).toHaveBeenCalledWith("t1", false);
  });
});
