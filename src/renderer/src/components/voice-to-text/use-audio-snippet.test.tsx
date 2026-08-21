import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAudioSnippet } from "./use-audio-snippet";

class FakeAudio {
  duration = 11.2846;
  currentTime = 0;
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

  // G8 F2: some sources report `duration === Infinity` until Chromium is
  // nudged with a throwaway seek - the intake measured this as the cause of
  // "0 seg. forever" in the preview while /finish shows the real duration
  // (pulled from the backend, not the browser).
  it("applies the Chromium Infinity workaround and reports once the retried durationchange resolves", () => {
    const onDuration = vi.fn();
    const file = new File(["audio"], "audiencia.wav", {
      type: "audio/wav",
    });
    const { result } = renderHook(() => useAudioSnippet(file, { onDuration }));

    audio.duration = Number.POSITIVE_INFINITY;
    act(() => audio.emit("loadedmetadata"));

    expect(onDuration).not.toHaveBeenCalled();
    expect(audio.currentTime).toBe(Number.MAX_SAFE_INTEGER);

    audio.duration = 11.2846;
    act(() => audio.emit("durationchange"));

    expect(result.current.durationMs).toBeCloseTo(11_284.6);
    expect(onDuration).toHaveBeenCalledOnce();
    expect(onDuration.mock.calls[0][0]).toBeCloseTo(11_284.6);
    expect(audio.currentTime).toBe(0);
  });

  // Critic (G8 repair): the Infinity retry can fail - the seek fires another
  // `durationchange` and `duration` is STILL Infinity. That path used to
  // leave `currentTime` parked at `MAX_SAFE_INTEGER` forever, since the undo
  // only ran in the finite branch above. A later `toggle()` would then call
  // `play()` from at/near the end of the media: nothing audible plays, but
  // `isPlaying` still flips true and shows a pause icon for a silent
  // snippet. This is the one path the two neighbouring tests don't cover -
  // the workaround test resolves to finite on retry, and the NaN test never
  // seeks at all (`NaN !== Number.POSITIVE_INFINITY`, so `seekAttemptedRef`
  // stays false and this restore is never exercised there).
  it("restores the seek position when the Infinity retry still doesn't resolve to a finite duration", () => {
    const onDuration = vi.fn();
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const file = new File(["audio"], "audiencia.wav", {
      type: "audio/wav",
    });
    const { result } = renderHook(() => useAudioSnippet(file, { onDuration }));

    audio.duration = Number.POSITIVE_INFINITY;
    act(() => audio.emit("loadedmetadata"));
    expect(audio.currentTime).toBe(Number.MAX_SAFE_INTEGER);

    // The retried durationchange fires, but the duration is still Infinity -
    // the workaround failed.
    act(() => audio.emit("durationchange"));

    expect(result.current.durationMs).toBe(0);
    expect(onDuration).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledOnce();
    // The load-bearing assertion: the element must not stay seeked past the
    // end of the media, or a subsequent `toggle()` plays silence while
    // reporting `isPlaying`.
    expect(audio.currentTime).toBe(0);

    // `vi.spyOn` on an already-mocked method returns the SAME spy rather
    // than a fresh one, and this file has no `restoreMocks`/`clearMocks`
    // config - restore explicitly so the next test's own `console.warn` spy
    // starts from a clean call count.
    warnSpy.mockRestore();
  });

  // A duration that never becomes finite (no known workaround for NaN,
  // unlike Infinity) must not fail silently - that silence is what made
  // this bug invisible in the first place.
  it("warns and leaves durationMs at 0 when duration never resolves to a finite value", () => {
    const onDuration = vi.fn();
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const file = new File(["audio"], "audiencia.wav", {
      type: "audio/wav",
    });
    const { result } = renderHook(() => useAudioSnippet(file, { onDuration }));

    audio.duration = Number.NaN;
    act(() => audio.emit("loadedmetadata"));

    expect(result.current.durationMs).toBe(0);
    expect(onDuration).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledOnce();
    expect(warnSpy.mock.calls[0][0]).toContain("audiencia.wav");
  });

  // Real Chromium fires `durationchange` BEFORE `loadedmetadata` (measured
  // by the G8 intake); both listeners call the same handler, so without a
  // "already reported" guard `onDuration` - which dispatches to the reducer
  // (voice-to-text/preview.tsx) - would fire twice for one file.
  it("reports the duration only once when durationchange arrives before loadedmetadata", () => {
    const onDuration = vi.fn();
    const file = new File(["audio"], "audiencia.wav", {
      type: "audio/wav",
    });
    const { result } = renderHook(() => useAudioSnippet(file, { onDuration }));

    act(() => audio.emit("durationchange"));
    act(() => audio.emit("loadedmetadata"));

    expect(result.current.durationMs).toBeCloseTo(11_284.6);
    expect(onDuration).toHaveBeenCalledOnce();
    expect(onDuration.mock.calls[0][0]).toBeCloseTo(11_284.6);
  });

  // Adversary: `toggle` starts playback with `audio.play().then(...)`, and the
  // callback unconditionally does `setIsPlaying(true)` plus installs the 10s
  // stop timer. `play()` on a large WAV can take hundreds of ms to resolve
  // (decode/buffer), which is plenty of time for the user to pick a different
  // file in the preview list. The `[file]` effect then tears down audio A and
  // builds audio B, but the in-flight promise still resolves against the OLD
  // element and reports "playing" for a file that is not playing.
  it("does not report playing when the file changes while play() is still pending", async () => {
    const fileA = new File(["a"], "audiencia-a.wav", { type: "audio/wav" });
    const fileB = new File(["b"], "audiencia-b.wav", { type: "audio/wav" });

    const { result, rerender } = renderHook(
      ({ file }) => useAudioSnippet(file),
      { initialProps: { file: fileA } },
    );

    const audioA = audio;
    let resolvePlay!: () => void;
    audioA.play.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolvePlay = resolve;
        }),
    );

    act(() => result.current.toggle());
    expect(result.current.isPlaying).toBe(false);

    // The user picks another file before playback ever started.
    rerender({ file: fileB });
    expect(audio).not.toBe(audioA);

    // Only now does the stale play() settle.
    await act(async () => {
      resolvePlay();
    });

    // Nothing is playing: audio A was torn down and audio B was never started.
    expect(result.current.isPlaying).toBe(false);
  });
});
