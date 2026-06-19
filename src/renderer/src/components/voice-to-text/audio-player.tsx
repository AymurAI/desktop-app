import { Player, type PlayerHandle } from "@aymurai/ui";
import type { ReactNode, Ref } from "react";
import { useTranslation } from "react-i18next";

/**
 * AudioPlayer — thin wrapper over @aymurai/ui's Player. The player primitive now
 * lives in the library (Figma-aligned); this wrapper only injects the i18n aria
 * labels and preserves the existing call-site API (default import + ref handle).
 */
export type AudioPlayerHandle = PlayerHandle;

interface AudioPlayerProps {
  src: string;
  durationMs: number;
  onTimeUpdate?: (currentMs: number) => void;
  onEnded?: () => void;
  rightSlot?: ReactNode;
  ref?: Ref<AudioPlayerHandle>;
}

export default function AudioPlayer({ ref, ...props }: AudioPlayerProps) {
  const { t } = useTranslation("voice-to-text");
  return (
    <Player
      {...props}
      ref={ref}
      labels={{
        rewind5s: t("editor.rewind5s"),
        forward5s: t("editor.forward5s"),
        play: t("editor.play"),
        pause: t("editor.pause"),
        speed: t("editor.speedAria"),
      }}
    />
  );
}
