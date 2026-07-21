import type { SpeakerColor } from "@/types/transcription";
import { Avatar } from "@aymurai/ui";

interface SpeakerAvatarProps {
  speaker: { initials: string; color: SpeakerColor };
  size?: "sm" | "md";
}

/**
 * Thin wrapper over @aymurai/ui's Avatar, preserving the `speaker` prop API used
 * across the transcription editor. The visual primitive now lives in the library.
 */
export default function SpeakerAvatar({
  speaker,
  size = "sm",
}: SpeakerAvatarProps) {
  return (
    <Avatar initials={speaker.initials} color={speaker.color} size={size} />
  );
}
