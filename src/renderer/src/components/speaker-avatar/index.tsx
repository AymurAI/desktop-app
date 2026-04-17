import { type SpeakerColor } from "@/types/transcription";
import { styled } from "@/styles/stitches.config";

const AvatarRoot = styled("div", {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "50%",
  flexShrink: 0,

  fontFamily: "$primary",
  fontWeight: "$default",
  fontSize: "$labelSm",
  lineHeight: "$labelSm",
  textAlign: "center",
  color: "$textDefault",

  variants: {
    size: {
      sm: {
        width: 24,
        height: 24,
      },
      md: {
        width: 32,
        height: 32,
      },
    },
    color: {
      primary: {
        backgroundColor: "$secondary",
      },
      secondary: {
        backgroundColor: "$bgSecondaryAlt",
      },
      warning: {
        backgroundColor: "$warningSecondary",
      },
      success: {
        backgroundColor: "$successSecondary",
      },
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

function SpeakerAvatar({ speaker, size = "sm" }: SpeakerAvatarProps) {
  return (
    <AvatarRoot size={size} color={speaker.color}>
      {speaker.initials}
    </AvatarRoot>
  );
}

export default SpeakerAvatar;
