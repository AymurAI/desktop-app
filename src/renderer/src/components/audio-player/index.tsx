import {
  ArrowClockwise,
  ArrowCounterClockwise,
  Pause,
  Play,
} from "phosphor-react";
import type React from "react";
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import { styled } from "@/styles";
import { formatTime } from "./formatTime";

// ---------------------------------------------------------------------------
// Styled components
// ---------------------------------------------------------------------------

const PlayerBar = styled("div", {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "24px 48px",
  height: "96px",
  backgroundColor: "#FFFFFF",
  borderTop: "1px solid #BCBAB8",
  boxSizing: "border-box",
});

const Controls = styled("div", {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: "4px",
  width: "156px",
  flexShrink: 0,
});

const IconButton = styled("button", {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "8px",
  width: "36px",
  height: "36px",
  borderRadius: "6px",
  border: "none",
  background: "transparent",
  cursor: "pointer",
  position: "relative",

  "&:hover": {
    backgroundColor: "#F3F3F3",
  },
});

const PlayButton = styled(IconButton, {
  backgroundColor: "#C5CAFF",

  "&:hover": {
    backgroundColor: "#C5CAFF",
    opacity: 0.85,
  },
});

const SkipLabel = styled("span", {
  fontSize: "8px",
  lineHeight: 1,
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  fontWeight: 700,
  color: "#110041",
  userSelect: "none",
  pointerEvents: "none",
});

const SpeedText = styled("span", {
  fontSize: "11px",
  fontWeight: 600,
  color: "#110041",
  whiteSpace: "nowrap",
  userSelect: "none",
});

const ProgressSection = styled("div", {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: "16px",
  flex: 1,
  marginLeft: "24px",
  marginRight: "24px",
});

const ProgressBar = styled("div", {
  height: "8px",
  backgroundColor: "#E0DDE2",
  borderRadius: "9999px",
  flex: 1,
  cursor: "pointer",
  position: "relative",
  overflow: "hidden",
});

const ProgressFill = styled("div", {
  height: "100%",
  backgroundColor: "#3F479D",
  borderRadius: "9999px",
  position: "absolute",
  left: 0,
  top: 0,
});

const TimeDisplay = styled("span", {
  fontSize: "12px",
  color: "#625C68",
  whiteSpace: "nowrap",
  flexShrink: 0,
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AudioPlayerProps {
  src: string;
  durationMs: number;
  onTimeUpdate?: (currentMs: number) => void;
  onEnded?: () => void;
}

export interface AudioPlayerHandle {
  play(): void;
  pause(): void;
  seekTo(ms: number): void;
  setPlaybackRate(rate: number): void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const PLAYBACK_RATES = [1, 1.5, 2, 0.75];

const AudioPlayer = forwardRef<AudioPlayerHandle, AudioPlayerProps>(
  function AudioPlayer({ src, durationMs, onTimeUpdate, onEnded }, ref) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const barRef = useRef<HTMLDivElement>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentMs, setCurrentMs] = useState(0);
    const [rateIndex, setRateIndex] = useState(0);

    // Expose imperative handle
    useImperativeHandle(ref, () => ({
      play() {
        audioRef.current?.play();
      },
      pause() {
        audioRef.current?.pause();
      },
      seekTo(ms: number) {
        if (audioRef.current) {
          audioRef.current.currentTime = ms / 1000;
        }
      },
      setPlaybackRate(rate: number) {
        if (audioRef.current) {
          audioRef.current.playbackRate = rate;
        }
      },
    }));

    // Internal handlers
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
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!barRef.current) return;
        const rect = barRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const ratio = Math.max(0, Math.min(1, clickX / rect.width));
        const seekMs = ratio * durationMs;
        if (audioRef.current) {
          audioRef.current.currentTime = seekMs / 1000;
        }
        setCurrentMs(seekMs);
        onTimeUpdate?.(seekMs);
      },
      [durationMs, onTimeUpdate],
    );

    const fillPercent = durationMs > 0 ? (currentMs / durationMs) * 100 : 0;

    return (
      <PlayerBar>
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

        <Controls>
          <IconButton
            type="button"
            aria-label="Retroceder 5 segundos"
            onClick={rewind5s}
          >
            <ArrowCounterClockwise size={20} />
            <SkipLabel>5</SkipLabel>
          </IconButton>

          <PlayButton
            type="button"
            aria-label={isPlaying ? "Pausar" : "Reproducir"}
            onClick={togglePlay}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </PlayButton>

          <IconButton
            type="button"
            aria-label="Adelantar 5 segundos"
            onClick={forward5s}
          >
            <ArrowClockwise size={20} />
            <SkipLabel>5</SkipLabel>
          </IconButton>

          <IconButton
            type="button"
            aria-label="Cambiar velocidad de reproducción"
            onClick={cycleSpeed}
          >
            <SpeedText>{PLAYBACK_RATES[rateIndex]}×</SpeedText>
          </IconButton>
        </Controls>

        <ProgressSection>
          <ProgressBar ref={barRef} onClick={handleBarClick}>
            <ProgressFill style={{ width: `${fillPercent}%` }} />
          </ProgressBar>
          <TimeDisplay>
            {formatTime(currentMs)} / {formatTime(durationMs)}
          </TimeDisplay>
        </ProgressSection>
      </PlayerBar>
    );
  },
);

export default AudioPlayer;
