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
  const [durationMs, setDurationMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  onDurationRef.current = onDuration;

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    audioRef.current = audio;

    const handleMeta = () => {
      const d = audio.duration;
      const nextDurationMs = Number.isFinite(d) ? d * 1000 : 0;
      setDurationMs(nextDurationMs);
      if (nextDurationMs > 0) onDurationRef.current?.(nextDurationMs);
    };
    const handleEnded = () => setIsPlaying(false);
    audio.addEventListener("loadedmetadata", handleMeta);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", handleMeta);
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
    audio.play().then(
      () => {
        setIsPlaying(true);
        if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
        stopTimerRef.current = setTimeout(() => {
          audio.pause();
          setIsPlaying(false);
        }, SNIPPET_MS);
      },
      () => setIsPlaying(false),
    );
  }, []);

  return { durationMs, isPlaying, toggle };
}
