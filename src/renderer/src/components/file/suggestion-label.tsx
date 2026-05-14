import Suggestion from "@/components/ui/suggestion";
import { css } from "@/styled/css";
import { HStack, styled } from "@/styled/jsx";
import type { AllLabels, AllLabelsWithSufix } from "@/types/aymurai";
import type { ComponentPropsWithoutRef } from "react";

interface SuggestionLabelProps
  extends Omit<ComponentPropsWithoutRef<"mark">, "translate" | "color"> {
  isClickable?: boolean;
  isHighlighted?: boolean;
  children: string;
  label: AllLabels | AllLabelsWithSufix | undefined;
}
export default function SuggestionLabel({
  isClickable = false,
  isHighlighted = false,
  label,
  children,
  ...props
}: SuggestionLabelProps) {
  return (
    <Suggestion
      clickable={isClickable}
      rounded
      className={
        isHighlighted
          ? css({
              outline: "[2px solid #3F479D]",
              outlineOffset: "[1px]",
              position: "relative",
              zIndex: "10",
            })
          : undefined
      }
      {...props}
    >
      <HStack gap="2" alignItems="baseline" px="1">
        <styled.span m="0">{children}</styled.span>
        <styled.span
          m="0"
          color="black"
          textTransform="uppercase"
          textStyle="cta.md.strong"
          fontFamily="[Archivo !important]"
        >
          {label ?? "DESCONOCIDO"}
        </styled.span>
      </HStack>
    </Suggestion>
  );
}
