import { FilePreview } from "@/components";
import FileSelectionLayout from "@/components/layout/file-selection-layout";
import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import MainContent from "@/components/layout/main-content";
import BackButton from "@/components/ui/back-button";
import RequireFile from "@/features/RequireFile";
import { useFileDispatch, useFiles } from "@/hooks";
import { useFileParse } from "@/hooks/useFileParse";
import { removeAllFiles } from "@/reducers/file/actions";
import { Stack, styled } from "@/styled/jsx";
import { FeatureFlowEnum, featureNamespace } from "@/types/features";
import { Button, Card } from "@aymurai/ui";
import {
  createFileRoute,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import VoicePreview from "@/components/voice-to-text/preview";

export const Route = createFileRoute("/app/$feature/preview")({
  component: RouteComponent,
});

function RouteComponent() {
  const { feature } = useParams({
    from: "/app/$feature/preview",
  });
  if (feature === FeatureFlowEnum.VoiceToText) return <VoicePreview />;
  return <DocumentPreview />;
}

function DocumentPreview() {
  const { feature } = useParams({
    from: "/app/$feature/preview",
  });
  const navigate = useNavigate();
  const { t } = useTranslation(featureNamespace[feature]);

  const files = useFiles();
  const dispatch = useFileDispatch();
  const parseStatuses = useFileParse(files);
  const file = files[0];

  const isProcessing = Boolean(file && !file.paragraphs);

  const handleRemove = () => {
    dispatch(removeAllFiles());
  };

  const handleConfirmFiles = () => {
    navigate({
      to: "/app/$feature/process",
      params: { feature },
    });
  };

  return (
    <RequireFile>
      <Header title={t("title")} currentStep={1} feature={feature} />
      <MainContent full>
        <FileSelectionLayout
          title={t("preview.sectionTitle")}
          backButton={
            <BackButton to="/app/$feature/onboarding" params={{ feature }} />
          }
        >
          <Card>
            <Stack gap="8" alignItems="center">
              <styled.h2 textStyle="subtitle.md.default" alignSelf="flex-start">
                {t("preview.filesLabel")}
              </styled.h2>
              {file && (
                <FilePreview
                  file={file}
                  status={parseStatuses[file.data.name]?.status ?? "processing"}
                  onRemove={handleRemove}
                />
              )}
            </Stack>
          </Card>
        </FileSelectionLayout>
      </MainContent>
      <Footer withBuiltBy>
        <Button onClick={handleConfirmFiles} disabled={isProcessing}>
          {t("preview.continue")}
        </Button>
      </Footer>
    </RequireFile>
  );
}
