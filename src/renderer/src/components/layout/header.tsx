import { useTutorialSeen } from "@/store/useLocal";
import { FeatureFlowEnum, featureNamespace } from "@/types/features";
import { AppHeader, type AppHeaderSlots } from "@aymurai/ui";
import { useTranslation } from "react-i18next";
import FeaturesMenu from "../features-menu";
import HowItWorksModal from "../how-it-works-modal";
import HeaderLogoLink from "./header-logo-link";
import { stepperHideClass } from "./stepper-visibility";

type DocumentStep = 1 | 2 | 3 | 4;

interface HeaderProps {
  title?: string;
  feature?: FeatureFlowEnum;
  currentStep?: DocumentStep;
}

export default function Header({ title, feature, currentStep }: HeaderProps) {
  const { t } = useTranslation();
  const { t: featureT } = useTranslation(
    feature ? featureNamespace[feature] : "common",
  );
  const tutorialSeen = useTutorialSeen(feature ?? FeatureFlowEnum.Dataset);
  const isVoiceToText = feature === FeatureFlowEnum.VoiceToText;
  const isSummarizer = feature === FeatureFlowEnum.Summarizer;
  const featureTitle = title ?? (feature ? featureT("title") : undefined);
  const steps =
    isVoiceToText || isSummarizer
      ? [
          featureT("stepper.step1"),
          featureT("stepper.step2"),
          featureT("stepper.step3"),
          featureT("stepper.step4"),
        ]
      : [
          t("stepper.selection"),
          t("stepper.extraction"),
          t("stepper.validation"),
          t("stepper.finalization"),
        ];
  const helpLabel = isVoiceToText
    ? featureT("howItWorks.helpAria")
    : t("howItWorks");
  const slots: AppHeaderSlots = {
    logo: (logo) => <HeaderLogoLink>{logo}</HeaderLogoLink>,
    help: (help) => {
      if (!feature || !tutorialSeen) return null;
      return <HowItWorksModal feature={feature} trigger={help} />;
    },
    apps: (apps) => <FeaturesMenu trigger={apps} />,
  };

  if (currentStep) {
    // No `feature` means no title next to the logo, so nothing for the stepper
    // to collide with — leave the class off rather than guessing a threshold.
    return (
      <AppHeader
        className={feature ? stepperHideClass(feature) : undefined}
        featureName={featureTitle}
        helpLabel={helpLabel}
        appsLabel={t("header.appsAria")}
        steps={steps}
        current={currentStep - 1}
        slots={slots}
      />
    );
  }

  return (
    <AppHeader
      featureName={featureTitle}
      logoVariant={featureTitle ? undefined : "logo"}
      helpLabel={helpLabel}
      appsLabel={t("header.appsAria")}
      slots={slots}
    />
  );
}
