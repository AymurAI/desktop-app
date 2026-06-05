import { useTranslation } from "react-i18next";

import { cva } from "@/styled/css";
import { HStack, styled } from "@/styled/jsx";

const stepCircle = cva({
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "8",
    height: "8",
    rounded: "full",
    textStyle: "label.md.strong",
    flexShrink: "0",
  },
  variants: {
    active: {
      true: { bg: "brand.primary", color: "text.onbutton-default" },
      false: { bg: "bg.secondary-highlight", color: "text.lighter" },
    },
  },
  defaultVariants: { active: false },
});

interface VoiceStepperProps {
  current: 1 | 2 | 3 | 4;
}

export default function VoiceStepper({ current }: VoiceStepperProps) {
  const { t } = useTranslation("voice-to-text");
  const labels = [
    t("stepper.step1"),
    t("stepper.step2"),
    t("stepper.step3"),
    t("stepper.step4"),
  ];

  return (
    <HStack gap="3" alignItems="center">
      {labels.map((label, i) => {
        const step = (i + 1) as 1 | 2 | 3 | 4;
        const isActive = step === current;
        return (
          <HStack key={step} gap="2" alignItems="center">
            <span className={stepCircle({ active: isActive })}>{step}</span>
            {isActive && (
              <styled.span textStyle="label.md.strong" color="text.default">
                {label}
              </styled.span>
            )}
          </HStack>
        );
      })}
    </HStack>
  );
}
