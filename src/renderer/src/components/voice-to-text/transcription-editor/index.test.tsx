import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Speaker, Transcription } from "@/types/transcription";
import TranscriptionEditor from ".";

// jsdom doesn't implement scrollIntoView at all.
Element.prototype.scrollIntoView = vi.fn();

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// The real AudioPlayer wraps @aymurai/ui's Player, which drives currentMs off
// a native <audio> element — not meaningful under jsdom. Stub it so the test
// can trigger `onTimeUpdate` directly, the same way real playback would.
let latestOnTimeUpdate: ((ms: number) => void) | undefined;
vi.mock("../audio-player", async () => {
  const React = await import("react");
  return {
    default: React.forwardRef(function MockAudioPlayer(
      props: { onTimeUpdate?: (ms: number) => void },
      ref: React.Ref<unknown>,
    ) {
      latestOnTimeUpdate = props.onTimeUpdate;
      React.useImperativeHandle(ref, () => ({
        seekTo: vi.fn(),
        play: vi.fn(),
        pause: vi.fn(),
        setPlaybackRate: vi.fn(),
      }));
      return null;
    }),
  };
});

const speaker: Speaker = {
  id: "s1",
  label: "Persona 1",
  initials: "P1",
  color: "primary",
};

const transcription: Transcription = {
  id: "doc-1",
  title: "Audiencia",
  audioFileName: "audiencia.mp3",
  audioDurationMs: 2000,
  audioObjectUrl: "blob:audio",
  speakers: [speaker],
  turns: [
    { id: "turn-a", speakerId: "s1", text: "Hola", startMs: 0, endMs: 1000 },
    { id: "turn-b", speakerId: "s1", text: "Chau", startMs: 1000, endMs: 2000 },
  ],
  source: "asr",
  createdAt: "2026-01-01T00:00:00.000Z",
};

// The search input also has an implicit "textbox" role, so turn text has to
// be looked up by its `data-turn-id` rather than role/order.
function getTurnTextbox(container: HTMLElement, turnId: string) {
  const el = container.querySelector(`[data-turn-id="${turnId}"]`);
  if (!el) throw new Error(`No editable text found for turn ${turnId}`);
  return el as HTMLElement;
}

describe("TranscriptionEditor edit-mode sync", () => {
  it("selects (and seeks) a turn when its editable text is clicked in edit mode", () => {
    const { container } = render(
      <TranscriptionEditor
        transcription={transcription}
        isEditMode
        onEditModeChange={vi.fn()}
      />,
    );

    // No turn selected yet -> side panel shows its empty state.
    expect(screen.getByText("sidePanel.empty")).toBeTruthy();

    fireEvent.click(getTurnTextbox(container, "turn-a"));

    // Clicking a turn's text now also calls onSelect (previously seek-only in
    // read mode, no-op in edit mode) -> the side panel switches out of its
    // empty state for the clicked turn.
    expect(screen.queryByText("sidePanel.empty")).toBeNull();
  });

  it("pauses auto-scroll while a turn's text is focused, and resumes on blur", () => {
    const scrollSpy = vi
      .spyOn(Element.prototype, "scrollIntoView")
      .mockImplementation(() => {});

    const { container } = render(
      <TranscriptionEditor
        transcription={transcription}
        isEditMode
        onEditModeChange={vi.fn()}
      />,
    );

    // Mount at currentMs=0 -> activeTurnId="turn-a" -> follow-scroll runs once.
    expect(scrollSpy).toHaveBeenCalled();
    scrollSpy.mockClear();

    const textboxA = getTurnTextbox(container, "turn-a");

    // User focuses turn-a to fix a typo while playback keeps advancing into
    // turn-b's range — the view must not jump away underneath them.
    fireEvent.focus(textboxA);
    act(() => latestOnTimeUpdate?.(1500));
    expect(scrollSpy).not.toHaveBeenCalled();

    // Leaving the field resumes follow-along for the (now) active turn.
    fireEvent.blur(textboxA);
    expect(scrollSpy).toHaveBeenCalled();

    scrollSpy.mockRestore();
  });
});

describe("TranscriptionEditor search toolbar", () => {
  it("searches, navigates, highlights and clears with accessible controls", () => {
    const scrollSpy = vi
      .spyOn(Element.prototype, "scrollIntoView")
      .mockImplementation(() => {});
    const { container } = render(
      <TranscriptionEditor
        transcription={transcription}
        isEditMode={false}
        onEditModeChange={vi.fn()}
      />,
    );

    const search = screen.getByLabelText("editor.searchAria");
    expect(search.getAttribute("placeholder")).toBe("editor.searchPlaceholder");

    fireEvent.change(search, { target: { value: "a" } });
    expect(screen.getByText("1 de 2")).toBeTruthy();
    expect(container.querySelectorAll("mark")).toHaveLength(2);

    fireEvent.click(screen.getByLabelText("editor.nextResult"));
    expect(screen.getByText("2 de 2")).toBeTruthy();
    expect(scrollSpy).toHaveBeenCalled();

    fireEvent.click(screen.getByLabelText("editor.prevResult"));
    expect(screen.getByText("1 de 2")).toBeTruthy();

    fireEvent.click(screen.getByLabelText("editor.clearSearch"));
    expect(search).toHaveValue("");
    expect(screen.queryByText("1 de 2")).toBeNull();
    expect(container.querySelectorAll("mark")).toHaveLength(0);
    scrollSpy.mockRestore();
  });
});
