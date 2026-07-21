import {
  createFileRoute,
  useNavigate,
  useParams,
} from "@tanstack/react-router";

import HiddenInput from "@/components/hidden-input";
import HowItWorks from "@/components/how-it-works";
import FileSelectionLayout from "@/components/layout/file-selection-layout";
import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import MainContent from "@/components/layout/main-content";
import { DOCUMENT_EXTENSIONS } from "@/constants/config";
import { useFileDispatch } from "@/hooks";
import { addFiles } from "@/reducers/file/actions";
import { useSetTutorialSeen, useTutorialSeen } from "@/store/useLocal";
import { HStack, styled } from "@/styled/jsx";
import { featureNamespace } from "@/types/features";
import { isAllowed } from "@/utils/file";
import { Button, FileDropZone } from "@aymurai/ui";
import { useQueryClient } from "@tanstack/react-query";
import { File as FileIcon } from "phosphor-react";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import VoiceOnboarding from "@/components/voice-to-text/onboarding";
import { FeatureFlowEnum } from "@/types/features";

// FIRST step of the processing workflow
export const Route = createFileRoute("/app/$feature/onboarding")({
  component: RouteComponent,
});

function RouteComponent() {
  const { feature } = useParams({
    from: "/app/$feature/onboarding",
  });
  if (feature === FeatureFlowEnum.VoiceToText) return <VoiceOnboarding />;
  return <DocumentOnboarding />;
}

function DocumentOnboarding() {
  const queryClient = useQueryClient();
  const { feature } = useParams({
    from: "/app/$feature/onboarding",
  });
  const navigate = useNavigate();
  const { t } = useTranslation(featureNamespace[feature]);

  const inputRef = useRef<HTMLInputElement>(null);

  const dispatch = useFileDispatch();
  const tutorialSeen = useTutorialSeen(feature);
  const toggleTutorialSeen = useSetTutorialSeen();
  const handleAddFiles = async (files: File[]) => {
    dispatch(addFiles(files));
    await navigate({
      to: "/app/$feature/preview",
      params: { feature },
    });
    toggleTutorialSeen(feature);
  };

  const handleInputChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const rawFiles = e.target.files;
    if (rawFiles) handleAddFiles(Array.from(rawFiles));
  };

  const handleOpenInput = () => {
    inputRef.current?.click();
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: only on mount
  useEffect(() => {
    queryClient.removeQueries({ queryKey: ["predict"] });
    queryClient.removeQueries({ queryKey: ["file-parser"] });
  }, []);

  return (
    <>
      <Header
        title={t("title")}
        feature={feature}
        currentStep={tutorialSeen ? 1 : undefined}
      />
      <MainContent full={tutorialSeen}>
        {tutorialSeen ? (
          <FileSelectionLayout title={t("onboarding.sectionTitle")}>
            <FileDropZone
              icon={<FileIcon />}
              title={t("onboarding.dropAreaTitle")}
              description={t("onboarding.dropAreaFormats")}
              onDrop={(files) => {
                const allowedFiles = files.filter((file) =>
                  isAllowed(file, DOCUMENT_EXTENSIONS),
                );
                if (allowedFiles.length > 0) handleAddFiles(allowedFiles);
              }}
              onClick={handleOpenInput}
            />
          </FileSelectionLayout>
        ) : (
          <HowItWorks feature={feature} />
        )}
      </MainContent>
      <Footer withBuiltBy>
        <HStack gap="4">
          {!tutorialSeen && (
            <styled.p textStyle="paragraph.sm.default">
              {t("onboarding.validFormats")}
            </styled.p>
          )}
          <Button onClick={handleOpenInput}>
            {t("onboarding.loadDocuments")}
          </Button>
        </HStack>
      </Footer>
      <HiddenInput
        ref={inputRef}
        onChange={handleInputChange}
        extensions={DOCUMENT_EXTENSIONS}
        multiple={feature === FeatureFlowEnum.Dataset}
      />
    </>
  );
}
