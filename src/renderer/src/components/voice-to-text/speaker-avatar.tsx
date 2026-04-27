import { cva } from "@/styled/css";
import type { SpeakerColor } from "@/types/transcription";

const avatar = cva({
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "full",
    flexShrink: "0",
    textAlign: "center",
    color: "text.default",
    textStyle: "label.sm.default",
  },
  variants: {
    size: {
      sm: { width: "6", height: "6" },
      md: { width: "8", height: "8" },
    },
    color: {
      primary: { bg: "bg.primary-highlight" },
      secondary: { bg: "bg.secondary-highlight" },
      warning: { bg: "system.warning-secondary" },
      success: { bg: "system.success-secondary" },
    },
  },
  defaultVariants: {
    size: "sm",
    color: "primary",
  },
});

interface SpeakerAvatarProps {
  speaker: { initials: string; color: SpeakerColor };
  size?: "sm" | "md";
}

export default function SpeakerAvatar({
  speaker,
  size = "sm",
}: SpeakerAvatarProps) {
  return (
    <div className={avatar({ size, color: speaker.color })}>
      {speaker.initials}
    </div>
  );
}
