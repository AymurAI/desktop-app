import { Question, X } from "phosphor-react";
import { useTranslation } from "react-i18next";

import Button from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SectionTitle } from "@/layout/section-title";
import { css } from "@/styled/css";
import { Grid, HStack, Stack, styled } from "@/styled/jsx";

const card = css({
  display: "flex",
  alignItems: "center",
  gap: "5",
  p: "6",
  rounded: "sm",
  border: "primary",
  bg: "bg.secondary",
});

const stepBadge = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "8",
  height: "8",
  rounded: "full",
  bg: "brand.primary",
  color: "text.onbutton-default",
  textStyle: "label.md.strong",
  flexShrink: "0",
});

const cardImg = css({ height: "[110px]", flexShrink: "0" });

const helpButton = css({
  color: "text.lighter",
  p: "0.5",
  rounded: "sm",
  cursor: "pointer",
  transition: "colors",
  "&:hover": { bg: "action.hover", color: "text.onbutton-alternative" },
});

const modalContent = css({ minWidth: "[900px]" });
const closeButton = css({ cursor: "pointer", color: "text.lighter" });

const CARD_KEYS = ["card1", "card2", "card3", "card4"] as const;
const CARD_IMAGES: Record<(typeof CARD_KEYS)[number], string> = {
  card1: "/onboarding-steps/step1.png",
  card2: "/onboarding-steps/step2.png",
  card3: "/onboarding-steps/step3.png",
  card4: "/onboarding-steps/step4.png",
};

export function VoiceHowItWorksGrid() {
  const { t } = useTranslation("voice-to-text");
  return (
    <Grid columns={2} rowGap="4" columnGap="4">
      {CARD_KEYS.map((key, i) => (
        <div key={key} className={card}>
          <img
            src={CARD_IMAGES[key]}
            alt={t(`howItWorks.cards.${key}.title`)}
            className={cardImg}
          />
          <HStack gap="4" alignItems="flex-start">
            <span className={stepBadge}>{i + 1}</span>
            <Stack gap="1">
              <styled.h3 textStyle="paragraph.sm.strong">
                {t(`howItWorks.cards.${key}.title`)}
              </styled.h3>
              <styled.p textStyle="paragraph.sm.default" color="text.lighter">
                {t(`howItWorks.cards.${key}.subtitle`)}
              </styled.p>
            </Stack>
          </HStack>
        </div>
      ))}
    </Grid>
  );
}

export default function VoiceHowItWorksModal() {
  const { t } = useTranslation("voice-to-text");
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className={helpButton}
          aria-label={t("howItWorks.helpAria")}
        >
          <Question size={32} />
        </button>
      </DialogTrigger>
      <DialogContent className={modalContent}>
        <Stack gap="6">
          <HStack justify="space-between" alignItems="center">
            <SectionTitle>{t("howItWorks.modalTitle")}</SectionTitle>
            <DialogClose className={closeButton}>
              <X size={32} />
            </DialogClose>
          </HStack>
          <VoiceHowItWorksGrid />
          <HStack justify="flex-end">
            <DialogClose asChild>
              <Button>{t("howItWorks.gotIt")}</Button>
            </DialogClose>
          </HStack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
