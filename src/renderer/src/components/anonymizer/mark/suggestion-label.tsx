import Suggestion from "@/components/ui/suggestion";
import { HStack, styled } from "@/styled/jsx";
import type { AllLabels } from "@/types/aymurai";

interface SuggestionLabelProps {
  isClickable?: boolean;
  children: string;
  label: AllLabels;
}
export default function SuggestionLabel({
  isClickable = false,
  label,
  children,
}: SuggestionLabelProps) {
  return (
    <Suggestion clickable={isClickable} rounded>
      <HStack gap="2" alignItems="baseline" px="1">
        <styled.span m="0">{children}</styled.span>
        <styled.span
          m="0"
          color="black"
          textTransform="uppercase"
          textStyle="cta.md.strong"
          fontFamily="[Archivo !important]"
        >
          {label}
        </styled.span>
      </HStack>
    </Suggestion>
  );
}
