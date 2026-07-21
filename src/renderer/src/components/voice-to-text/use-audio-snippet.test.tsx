import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAudioSnippet } from "./use-audio-snippet";

class FakeAudio {
  duration = 11.2846;
  paused = true;
  readonly pause = vi.fn(() => {
    this.paused = true;
  });
  readonly play = vi.fn(async () => {
    this.paused = false;
  });
  private readonly listeners = new Map<string, Set<EventListener>>();

  addEventListener(type: string, listener: EventListener) {
    const listeners = this.listeners.get(type) ?? new Set<EventListener>();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type: string, listener: EventListener) {
    this.listeners.get(type)?.delete(listener);
  }

  emit(type: string) {
    for (const listener of this.listeners.get(type) ?? []) {
      listener(new Event(type));
    }
  }
}

describe("useAudioSnippet", () => {
  let audio: FakeAudio;

  beforeEach(() => {
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:preview"),
      revokeObjectURL: vi.fn(),
    });
    vi.stubGlobal(
      "Audio",
      vi.fn(function AudioMock() {
        audio = new FakeAudio();
        return audio;
      }),
    );
  });

  afterEach(() => vi.unstubAllGlobals());

  it("reports browser media duration when metadata loads", () => {
    const onDuration = vi.fn();
    const file = new File(["audio"], "audiencia.wav", {
      type: "audio/wav",
    });
    const { result } = renderHook(() => useAudioSnippet(file, { onDuration }));

    act(() => audio.emit("loadedmetadata"));

    expect(result.current.durationMs).toBeCloseTo(11_284.6);
    expect(onDuration).toHaveBeenCalledOnce();
    expect(onDuration.mock.calls[0][0]).toBeCloseTo(11_284.6);
  });
});
