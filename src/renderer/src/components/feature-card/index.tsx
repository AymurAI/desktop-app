import { type ReactNode } from "react";

import { styled } from "@/styles/stitches.config";

const IconContainer = styled("div", {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 48,
  height: 48,
  borderRadius: 12,
  backgroundColor: "$primaryAlt",
  flexShrink: 0,
});

const CardTitle = styled("span", {
  fontFamily: "$primary",
  fontWeight: "$strong",
  fontSize: "$subtitleMd",
  lineHeight: "$subtitleMd",
  color: "$primary",
});

const CardDescription = styled("span", {
  fontFamily: "$primary",
  fontWeight: "$default",
  fontSize: "$subtitleSm",
  lineHeight: "$subtitleSm",
  color: "$textLighter",
});

const StyledCard = styled("div", {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  padding: 24,
  width: 320,
  backgroundColor: "$bgSecondary",
  border: "1px solid $borderPrimary",
  borderRadius: "$s",
  transition: "box-shadow $transitions$s, opacity $transitions$s",

  variants: {
    disabled: {
      true: {
        opacity: 0.5,
        cursor: "not-allowed",
      },
      false: {
        cursor: "pointer",
        "&:hover": {
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
        },
      },
    },
  },
  defaultVariants: {
    disabled: false,
  },
});

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
  disabled?: boolean;
}

function FeatureCard({ icon, title, description, onClick, disabled = false }: FeatureCardProps) {
  return (
    <StyledCard
      disabled={disabled}
      onClick={!disabled ? onClick : undefined}
      role={onClick ? "button" : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
    >
      <IconContainer>{icon}</IconContainer>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </StyledCard>
  );
}

export default FeatureCard;
