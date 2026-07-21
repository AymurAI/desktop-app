import FeaturesMenu from "@/components/features-menu";
import HowItWorksModal from "@/components/how-it-works-modal";
import { useTutorialSeen } from "@/store/useLocal";
import { FeatureFlowEnum } from "@/types/features";
import { AppHeader, type AppHeaderSlots } from "@aymurai/ui";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

type VoiceStep = 1 | 2 | 3 | 4;

interface VoiceHeaderProps {
  currentStep?: VoiceStep;
}

export default function VoiceHeader({ currentStep }: VoiceHeaderProps) {
  const { t } = useTranslation("voice-to-text");
  const tutorialSeen = useTutorialSeen(FeatureFlowEnum.VoiceToText);
  const steps = [
    t("stepper.step1"),
    t("stepper.step2"),
    t("stepper.step3"),
    t("stepper.step4"),
  ];
  const slots: AppHeaderSlots = {
    logo: (logo) => <Link to="/home/features">{logo}</Link>,
    help: (help) =>
      tutorialSeen ? (
        <HowItWorksModal feature={FeatureFlowEnum.VoiceToText} trigger={help} />
      ) : null,
    apps: (apps) => <FeaturesMenu trigger={apps} />,
  };

  if (currentStep) {
    return (
      <AppHeader
        featureName={t("title")}
        helpLabel={t("howItWorks.helpAria")}
        appsLabel={t("header.appsAria")}
        steps={steps}
        current={currentStep - 1}
        slots={slots}
      />
    );
  }

  return (
    <AppHeader
      featureName={t("title")}
      helpLabel={t("howItWorks.helpAria")}
      appsLabel={t("header.appsAria")}
      slots={slots}
    />
  );
}
