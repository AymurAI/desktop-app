import { useTranslation } from "react-i18next";

import { css } from "@/styled/css";
import { HStack, styled } from "@/styled/jsx";

const circle = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "8",
  height: "8",
  rounded: "full",
  fontWeight: "[600]",
  fontSize: "[14px]",
  flexShrink: "0",
});

const activeCircle = css({
  bg: "brand.primary",
  color: "text.onbutton-default",
});

const inactiveCircle = css({
  bg: "bg.secondary-highlight",
  color: "text.lighter",
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
          <HStack key={label} gap="2" alignItems="center">
            <span
              className={`${circle} ${isActive ? activeCircle : inactiveCircle}`}
            >
              {step}
            </span>
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
