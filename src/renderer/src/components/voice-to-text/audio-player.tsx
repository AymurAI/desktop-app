import {
  ArrowClockwise,
  ArrowCounterClockwise,
  Pause,
  Play,
} from "phosphor-react";
import {
  type MouseEvent,
  type ReactNode,
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import { css } from "@/styled/css";
import { formatTime } from "./format-time";

const playerBar = css({
  display: "flex",
  flexDir: "row",
  alignItems: "center",
  justifyContent: "space-between",
  px: "12",
  py: "6",
  height: "24",
  bg: "bg.secondary",
  borderTopWidth: "[1px]",
  borderTopStyle: "solid",
  borderTopColor: "[#BCBAB8]",
  boxSizing: "border-box",
});

const controls = css({
  display: "flex",
  flexDir: "row",
  alignItems: "center",
  gap: "1",
  width: "[156px]",
  flexShrink: "0",
});

const iconButton = css({
  display: "flex",
  flexDir: "column",
  alignItems: "center",
  justifyContent: "center",
  p: "2",
  width: "9",
  height: "9",
  rounded: "md",
  border: "[none]",
  background: "transparent",
  cursor: "pointer",
  position: "relative",
  "&:hover": { bg: "[#F3F3F3]" },
});

const playButton = css({
  display: "flex",
  flexDir: "column",
  alignItems: "center",
  justifyContent: "center",
  p: "2",
  width: "9",
  height: "9",
  rounded: "md",
  border: "[none]",
  cursor: "pointer",
  position: "relative",
  bg: "action.default",
  "&:hover": { bg: "action.default", opacity: "0.85" },
});

const skipLabel = css({
  fontSize: "[8px]",
  lineHeight: "[1]",
  position: "absolute",
  top: "[50%]",
  left: "[50%]",
  transform: "[translate(-50%, -50%)]",
  fontWeight: "[700]",
  color: "text.default",
  userSelect: "none",
  pointerEvents: "none",
});

const speedText = css({
  fontSize: "[11px]",
  fontWeight: "[600]",
  color: "text.default",
  whiteSpace: "nowrap",
  userSelect: "none",
});

const progressSection = css({
  display: "flex",
  flexDir: "row",
  alignItems: "center",
  gap: "4",
  flex: "[1]",
  mx: "6",
});

const progressBar = css({
  height: "2",
  bg: "bg.secondary-highlight",
  rounded: "full",
  flex: "[1]",
  cursor: "pointer",
  position: "relative",
  overflow: "hidden",
});

const progressFill = css({
  height: "[100%]",
  bg: "brand.primary",
  rounded: "full",
  position: "absolute",
  left: "[0]",
  top: "[0]",
});

const timeDisplay = css({
  fontSize: "[12px]",
  color: "text.lighter",
  whiteSpace: "nowrap",
  flexShrink: "0",
});

interface AudioPlayerProps {
  src: string;
  durationMs: number;
  onTimeUpdate?: (currentMs: number) => void;
  onEnded?: () => void;
  rightSlot?: ReactNode;
}

export interface AudioPlayerHandle {
  play(): void;
  pause(): void;
  seekTo(ms: number): void;
  setPlaybackRate(rate: number): void;
}

const PLAYBACK_RATES = [1, 1.5, 2, 0.75];

const AudioPlayer = forwardRef<AudioPlayerHandle, AudioPlayerProps>(
  function AudioPlayer(
    { src, durationMs, onTimeUpdate, onEnded, rightSlot },
    ref,
  ) {
    const { t } = useTranslation("voice-to-text");
    const audioRef = useRef<HTMLAudioElement>(null);
    const barRef = useRef<HTMLDivElement>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentMs, setCurrentMs] = useState(0);
    const [rateIndex, setRateIndex] = useState(0);

    useImperativeHandle(ref, () => ({
      play() {
        audioRef.current?.play();
      },
      pause() {
        audioRef.current?.pause();
      },
      seekTo(ms: number) {
        if (audioRef.current) audioRef.current.currentTime = ms / 1000;
      },
      setPlaybackRate(rate: number) {
        if (audioRef.current) audioRef.current.playbackRate = rate;
      },
    }));

    const handleTimeUpdate = useCallback(() => {
      if (!audioRef.current) return;
      const ms = audioRef.current.currentTime * 1000;
      setCurrentMs(ms);
      onTimeUpdate?.(ms);
    }, [onTimeUpdate]);

    const handleEnded = useCallback(() => {
      setIsPlaying(false);
      onEnded?.();
    }, [onEnded]);

    const togglePlay = useCallback(() => {
      if (!audioRef.current) return;
      if (audioRef.current.paused) {
        audioRef.current.play();
        setIsPlaying(true);
      } else {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }, []);

    const rewind5s = useCallback(() => {
      if (!audioRef.current) return;
      audioRef.current.currentTime = Math.max(
        0,
        audioRef.current.currentTime - 5,
      );
    }, []);

    const forward5s = useCallback(() => {
      if (!audioRef.current) return;
      const duration = audioRef.current.duration || 0;
      audioRef.current.currentTime = Math.min(
        duration,
        audioRef.current.currentTime + 5,
      );
    }, []);

    const cycleSpeed = useCallback(() => {
      setRateIndex((prev) => {
        const nextIndex = (prev + 1) % PLAYBACK_RATES.length;
        if (audioRef.current) {
          audioRef.current.playbackRate = PLAYBACK_RATES[nextIndex];
        }
        return nextIndex;
      });
    }, []);

    const handleBarClick = useCallback(
      (e: MouseEvent<HTMLDivElement>) => {
        if (!barRef.current) return;
        const rect = barRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const ratio = Math.max(0, Math.min(1, clickX / rect.width));
        const seekMs = ratio * durationMs;
        if (audioRef.current) audioRef.current.currentTime = seekMs / 1000;
        setCurrentMs(seekMs);
        onTimeUpdate?.(seekMs);
      },
      [durationMs, onTimeUpdate],
    );

    const fillPercent = durationMs > 0 ? (currentMs / durationMs) * 100 : 0;

    return (
      <div className={playerBar}>
        {/* biome-ignore lint/a11y/useMediaCaption: programmatic audio player, captions not applicable */}
        <audio
          ref={audioRef}
          src={src}
          hidden
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        <div className={controls}>
          <button
            type="button"
            aria-label={t("editor.rewind5s")}
            onClick={rewind5s}
            className={iconButton}
          >
            <ArrowCounterClockwise size={20} />
            <span className={skipLabel}>5</span>
          </button>

          <button
            type="button"
            aria-label={isPlaying ? t("editor.pause") : t("editor.play")}
            onClick={togglePlay}
            className={playButton}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>

          <button
            type="button"
            aria-label={t("editor.forward5s")}
            onClick={forward5s}
            className={iconButton}
          >
            <ArrowClockwise size={20} />
            <span className={skipLabel}>5</span>
          </button>

          <button
            type="button"
            aria-label={t("editor.speedAria")}
            onClick={cycleSpeed}
            className={iconButton}
          >
            <span className={speedText}>{PLAYBACK_RATES[rateIndex]}×</span>
          </button>
        </div>

        <div className={progressSection}>
          <div ref={barRef} onClick={handleBarClick} className={progressBar}>
            <div
              className={progressFill}
              style={{ width: `${fillPercent}%` }}
            />
          </div>
          <span className={timeDisplay}>
            {formatTime(currentMs)} / {formatTime(durationMs)}
          </span>
        </div>

        {rightSlot}
      </div>
    );
  },
);

export default AudioPlayer;
