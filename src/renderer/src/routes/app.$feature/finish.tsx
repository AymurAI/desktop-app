import { FinishAnonymizer, FinishDataset } from "@/components";
import FeaturesMenu from "@/components/features-menu";
import HowItWorksModal from "@/components/how-it-works-modal";
import Stepper from "@/components/home/stepper";
import Header from "@/components/layout/header";
import { useTutorialSeen } from "@/store/useLocal";
import { HStack } from "@/styled/jsx";
import { FeatureFlowEnum, featureName } from "@/types/features";
import { createFileRoute, useParams } from "@tanstack/react-router";

export const Route = createFileRoute("/app/$feature/finish")({
  component: RouteComponent,
});

function RouteComponent() {
  const { feature } = useParams({ from: "/app/$feature/finish" });
  const tutorialSeen = useTutorialSeen(feature);

  return (
    <>
      <Header
        title={featureName(feature)}
        center={
          feature === FeatureFlowEnum.Dataset ? (
            <Stepper currentStep={4} />
          ) : undefined
        }
        right={
          <HStack>
            {tutorialSeen && <HowItWorksModal feature={feature} />}
            <FeaturesMenu />
          </HStack>
        }
      />
      {feature === FeatureFlowEnum.Dataset ? (
        <FinishDataset />
      ) : (
        <FinishAnonymizer />
      )}
    </>
  );
}
