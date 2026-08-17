import { SectionTitle } from "@/layout/section-title";
import { Stack } from "@/styled/jsx";
import { type FeatureFlowEnum, featureNamespace } from "@/types/features";
import { TutorialGrid, type TutorialStep } from "@aymurai/ui";
import type { TFunction } from "i18next";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

type FeatureTutorialT = TFunction<(typeof featureNamespace)[FeatureFlowEnum]>;

export function buildTutorialSteps(tFeature: FeatureTutorialT): TutorialStep[] {
  return ([1, 2, 3, 4] as const).map((step) => ({
    image: `${import.meta.env.BASE_URL}onboarding-steps/step${step}.png`,
    imageAlt: tFeature(`howItWorks.step${step}.alt`),
    title: tFeature(`howItWorks.step${step}.title`),
    description: tFeature(`howItWorks.step${step}.subtitle`),
  }));
}

interface HowItWorksProps {
  title?: ReactNode;
  feature: FeatureFlowEnum;
}

export default function HowItWorks({ title, feature }: HowItWorksProps) {
  const { t } = useTranslation();
  const { t: tFeature } = useTranslation(featureNamespace[feature]);
  const renderedTitle =
    typeof title === "string" ? (
      <SectionTitle>{title}</SectionTitle>
    ) : (
      (title ?? <SectionTitle>{t("howItWorks")}</SectionTitle>)
    );

  return (
    <Stack gap="6">
      {renderedTitle}
      <TutorialGrid steps={buildTutorialSteps(tFeature)} />
    </Stack>
  );
}
