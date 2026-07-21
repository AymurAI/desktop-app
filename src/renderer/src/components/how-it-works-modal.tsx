import { SectionTitle } from "@/layout/section-title";
import { css } from "@/styled/css";
import { HStack, Stack } from "@/styled/jsx";
import type { FeatureFlowEnum } from "@/types/features";
import { Question, X } from "phosphor-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import HowItWorks from "./how-it-works";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "./ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

const tooltip = css({
  padding: "2",
  textStyle: "label.md.default",
});

const modalButton = css({
  color: "text.lighter",

  padding: "0.5",
  rounded: "sm",

  cursor: "pointer",

  transition: "colors",

  "&:hover": {
    bg: "action.hover",
    color: "text.onbutton-alternative",
  },
});

const closeButton = css({
  cursor: "pointer",
});

const content = css({
  minWidth: "[900px]",
  maxW: "5xl!",
  maxH: "[90vh]",
  overflowY: "auto",
});

interface HowItWorksModalProps {
  feature: FeatureFlowEnum;
  trigger?: ReactElement;
}
export default function HowItWorksModal({
  feature,
  trigger,
}: HowItWorksModalProps) {
  const { t } = useTranslation();

  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            {trigger ?? (
              <button
                type="button"
                className={modalButton}
                aria-label="Información sobre AymurAI"
              >
                <Question size={32} />
              </button>
            )}
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent className={tooltip}>{t("howItWorks")}</TooltipContent>
      </Tooltip>
      <DialogContent className={content} style={{ width: "90vw" }}>
        <Stack gap="0">
          <HowItWorks
            title={
              <HStack justify="space-between">
                <SectionTitle>{t("howItWorks")}</SectionTitle>
                <DialogClose className={closeButton}>
                  <X size={32} />
                </DialogClose>
              </HStack>
            }
            feature={feature}
          />
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
