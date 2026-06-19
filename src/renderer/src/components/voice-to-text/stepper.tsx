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
    // Figma-aligned states (same colours as @aymurai/ui Stepper):
    //   complete → action.alt-default fill, white number
    //   active   → action.default fill + primary-alt border, dark number
    //   future   → action.disabled fill, dark number
    state: {
      complete: {
        bg: "action.alt-default",
        color: "text.onbutton-alternative",
      },
      active: {
        bg: "action.default",
        color: "text.default",
        borderWidth: "[1px]",
        borderStyle: "solid",
        borderColor: "text.default",
      },
      future: { bg: "action.disabled", color: "text.default" },
    },
  },
  defaultVariants: { state: "future" },
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
        const state =
          step < current ? "complete" : isActive ? "active" : "future";
        return (
          <HStack key={step} gap="2" alignItems="center">
            <span className={stepCircle({ state })}>{step}</span>
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
