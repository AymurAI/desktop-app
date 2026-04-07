import { Button, FileAnnotator, Grid, ValidateDataset } from "@/components";
import FeaturesMenu from "@/components/features-menu";
import HowItWorksModal from "@/components/how-it-works-modal";
import Stepper from "@/components/home/stepper";
import Header from "@/components/layout/header";
import { useFiles } from "@/hooks";
import { Footer } from "@/layout/main-old";
import { useTutorialSeen } from "@/store/useLocal";
import { HStack } from "@/styled/jsx";
import { FeatureFlowEnum, featureName } from "@/types/features";
import {
  createFileRoute,
  useNavigate,
  useParams,
} from "@tanstack/react-router";

export const Route = createFileRoute("/app/$feature/validation")({
  component: ValidationRoute,
});

function ValidateAnonymizer() {
  const { feature } = useParams({
    from: "/app/$feature/validation",
  });
  const file = useFiles()[0]!;
  const navigate = useNavigate();

  const handleContinue = () =>
    navigate({ to: "/app/$feature/finish", params: { feature } });

  return (
    <>
      <Grid
        columns={1}
        spacing="none"
        justify="stretch"
        align="stretch"
        css={{ overflow: "hidden" }}
      >
        <FileAnnotator {...{ file }} isAnnotable />
      </Grid>

      <Footer
        css={{
          justifyContent: "flex-end",
          gap: 150,
        }}
      >
        <Button size="md" onClick={handleContinue}>
          Anonimizar documento
        </Button>
      </Footer>
    </>
  );
}

function ValidationRoute() {
  const { feature } = Route.useParams();
  const tutorialSeen = useTutorialSeen(feature);

  return (
    <>
      <Header
        title={featureName(feature)}
        center={
          feature === FeatureFlowEnum.Dataset ? (
            <Stepper currentStep={3} />
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
        <ValidateDataset />
      ) : (
        <ValidateAnonymizer />
      )}
    </>
  );
}
