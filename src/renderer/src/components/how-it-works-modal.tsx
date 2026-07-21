import type { FeatureFlowEnum } from "@/types/features";
import { featureNamespace } from "@/types/features";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TutorialDialog,
} from "@aymurai/ui";
import { Question } from "phosphor-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { buildTutorialSteps } from "./how-it-works";

interface HowItWorksModalProps {
  feature: FeatureFlowEnum;
  trigger?: ReactElement;
}

export default function HowItWorksModal({
  feature,
  trigger,
}: HowItWorksModalProps) {
  const { t } = useTranslation();
  const { t: tFeature } = useTranslation(featureNamespace[feature]);
  const actualTrigger = trigger ?? (
    <button type="button" aria-label="Información sobre AymurAI">
      <Question size={32} />
    </button>
  );

  return (
    <Tooltip>
      <TutorialDialog
        trigger={<TooltipTrigger asChild>{actualTrigger}</TooltipTrigger>}
        title={t("howItWorks")}
        steps={buildTutorialSteps(tFeature)}
        closeLabel={t("close")}
      />
      <TooltipContent>{t("howItWorks")}</TooltipContent>
    </Tooltip>
  );
}
