import { useCallback, useEffect, useRef, useState } from "react";

/** Human-readable duration: "1 h. 0 min. 3 seg.", "46 min. 34 seg." or "9 seg." */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "0 seg.";
  const totalSeconds = Math.round(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    const hoursLabel = hours === 1 ? "h." : "hs.";
    return `${hours} ${hoursLabel} ${minutes} min. ${seconds} seg.`;
  }
  if (minutes === 0) return `${seconds} seg.`;
  return `${minutes} min. ${seconds} seg.`;
}

const SNIPPET_MS = 10_000;

interface UseAudioSnippet {
  durationMs: number;
  isPlaying: boolean;
  /** Play a 10s snippet from the current position; toggles to pause if playing. */
  toggle: () => void;
}

interface UseAudioSnippetOptions {
  onDuration?: (durationMs: number) => void;
}

/**
 * Owns an off-DOM <audio> element for `file`, reads its duration once metadata
 * loads, and plays a 10-second snippet (auto-pausing at +10s) on toggle.
 */
export function useAudioSnippet(
  file: File,
  { onDuration }: UseAudioSnippetOptions = {},
): UseAudioSnippet {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onDurationRef = useRef(onDuration);
  // "Already tried the Chromium seek workaround" / "already reported this
  // file's duration" / "already warned about this file" - see handleMeta
  // below (G8 F2). Reset per file inside the effect, since these live in
  // the hook's scope rather than the effect's, and the effect depends on
  // `[file]`.
  const seekAttemptedRef = useRef(false);
  const reportedRef = useRef(false);
  const warnedRef = useRef(false);
  const [durationMs, setDurationMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  onDurationRef.current = onDuration;

  useEffect(() => {
    seekAttemptedRef.current = false;
    reportedRef.current = false;
    warnedRef.current = false;

    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    audioRef.current = audio;

    const handleMeta = () => {
      const d = audio.duration;

      if (Number.isFinite(d)) {
        const nextDurationMs = d * 1000;
        setDurationMs(nextDurationMs);

        // Undo the Chromium seek workaround below, now that a real
        // duration is available.
        if (seekAttemptedRef.current) {
          audio.currentTime = 0;
          seekAttemptedRef.current = false;
        }

        // In real Chromium, `durationchange` fires BEFORE `loadedmetadata`
        // (measured by the G8 intake), and both listeners call this same
        // function - report at most once per file, or `onDuration` (which
        // dispatches to the reducer, see preview.tsx) fires twice.
        if (nextDurationMs > 0 && !reportedRef.current) {
          reportedRef.current = true;
          onDurationRef.current?.(nextDurationMs);
        }
        return;
      }

      // `duration` is Infinity (Chromium's "unknown length" state, seen for
      // some streamed/oddly-encoded sources) or NaN. Chromium's documented
      // workaround for the Infinity case is a throwaway seek to a huge
      // `currentTime`, which forces it to resolve the real duration and
      // fire another `durationchange` - try that exactly once per file.
      if (d === Number.POSITIVE_INFINITY && !seekAttemptedRef.current) {
        seekAttemptedRef.current = true;
        audio.currentTime = Number.MAX_SAFE_INTEGER;
        return;
      }

      // Either NaN (no known workaround), or the seek above already ran
      // once and the duration is STILL not finite - nothing left to try.
      // Failing loudly here is the point: this hook used to map any
      // non-finite duration to 0 in total silence, which is exactly what
      // made "0 seg. forever in the preview" invisible (G8 F2). If a real
      // .wav still hits this path, the warning is what will say why.
      //
      // Critic (G8 repair): the seek workaround above must be undone here
      // too, not only in the finite branch - otherwise a failed retry (the
      // seek fires another `durationchange` and `d` is STILL Infinity)
      // leaves `currentTime` parked at `MAX_SAFE_INTEGER` (near/at the end
      // of the media) forever. `toggle`'s `play()` would then run from that
      // position: nothing audible plays, but `isPlaying` still flips true
      // and shows a pause icon for a silent snippet.
      if (seekAttemptedRef.current) {
        audio.currentTime = 0;
        seekAttemptedRef.current = false;
      }

      if (!warnedRef.current) {
        warnedRef.current = true;
        setDurationMs(0);
        console.warn(
          `[useAudioSnippet] could not read a finite duration for "${file.name}" (duration=${d})`,
        );
      }
    };
    const handleEnded = () => setIsPlaying(false);
    audio.addEventListener("loadedmetadata", handleMeta);
    audio.addEventListener("durationchange", handleMeta);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", handleMeta);
      audio.removeEventListener("durationchange", handleMeta);
      audio.removeEventListener("ended", handleEnded);
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      URL.revokeObjectURL(url);
      audioRef.current = null;
    };
  }, [file]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) {
      audio.pause();
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      setIsPlaying(false);
      return;
    }
    // Adversary (G8 repair): `play()` on a large file can take hundreds of ms
    // to resolve (decode/buffer) - long enough for the user to switch files
    // before it settles. The `[file]` effect above tears down THIS `audio`
    // element and builds a new one for the next file, but the in-flight
    // promise still resolves against the captured (now stale) element -
    // both handlers must confirm `audio` is still the current one before
    // touching state, or the button reports "playing" for a file that was
    // never started (and stays wrong until the stale 10s timer fires).
    audio.play().then(
      () => {
        if (audioRef.current !== audio) return;
        setIsPlaying(true);
        if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
        stopTimerRef.current = setTimeout(() => {
          audio.pause();
          setIsPlaying(false);
        }, SNIPPET_MS);
      },
      () => {
        if (audioRef.current !== audio) return;
        setIsPlaying(false);
      },
    );
  }, []);

  return { durationMs, isPlaying, toggle };
}
