import { FileAnnotator, ValidateDataset } from "@/components";
import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import RequireFile from "@/features/RequireFile";
import { useFiles } from "@/hooks";
import { Grid } from "@/styled/jsx";
import { FeatureFlowEnum, featureNamespace } from "@/types/features";
import { Button } from "@aymurai/ui";
import {
  createFileRoute,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import VoiceValidation from "@/components/voice-to-text/validation";

export const Route = createFileRoute("/app/$feature/validation")({
  component: RouteComponent,
});

function RouteComponent() {
  const { feature } = useParams({
    from: "/app/$feature/validation",
  });
  if (feature === FeatureFlowEnum.VoiceToText) return <VoiceValidation />;
  return <DocumentValidation />;
}

function DocumentValidation() {
  const { feature } = useParams({
    from: "/app/$feature/validation",
  });

  const navigate = useNavigate();
  const { t } = useTranslation(featureNamespace[feature]);

  const file = useFiles()[0]!;

  const handleContinue = () =>
    navigate({ to: "/app/$feature/finish", params: { feature } });

  if (feature === FeatureFlowEnum.Anonymizer)
    return (
      <RequireFile>
        <Header title={t("title")} currentStep={3} feature={feature} />
        <Grid
          columns={1}
          gap="0"
          flex="1"
          minHeight="0"
          overflow="hidden"
          justifyContent="stretch"
          alignItems="stretch"
        >
          <FileAnnotator {...{ file }} isAnnotable />
        </Grid>

        <Footer withBuiltBy>
          <Button size="md" onClick={handleContinue}>
            Anonimizar documento
          </Button>
        </Footer>
      </RequireFile>
    );
  return (
    <RequireFile>
      <Header title={t("title")} currentStep={3} feature={feature} />
      <ValidateDataset />
    </RequireFile>
  );
}
