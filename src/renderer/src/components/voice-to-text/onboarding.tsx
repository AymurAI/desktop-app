import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { type ChangeEventHandler, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import HiddenInput from "@/components/hidden-input";
import HowItWorks from "@/components/how-it-works";
import FileSelectionLayout from "@/components/layout/file-selection-layout";
import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import MainContent from "@/components/layout/main-content";
import { FEATURE_ICON, MEDIA_EXTENSIONS } from "@/constants/config";
import { useFileDispatch } from "@/hooks";
import { useTranscriptionDispatch } from "@/hooks/useTranscriptions";
import { addFiles } from "@/reducers/file/actions";
import { clearTranscriptions } from "@/reducers/transcription/actions";
import { useSetTutorialSeen, useTutorialSeen } from "@/store/useLocal";
import { HStack, styled } from "@/styled/jsx";
import { FeatureFlowEnum } from "@/types/features";
import { isAllowed } from "@/utils/file";
import { Button, FileDropZone } from "@aymurai/ui";

export default function VoiceOnboarding() {
  const { t } = useTranslation("voice-to-text");
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const inputRef = useRef<HTMLInputElement>(null);
  const dispatch = useFileDispatch();
  const transcriptionDispatch = useTranscriptionDispatch();
  const tutorialSeen = useTutorialSeen(FeatureFlowEnum.VoiceToText);
  const toggleTutorialSeen = useSetTutorialSeen();
  const VoiceIcon = FEATURE_ICON.VOICE_TO_TEXT;

  const handleAddFiles = async (files: File[]) => {
    dispatch(addFiles(files));
    toggleTutorialSeen(FeatureFlowEnum.VoiceToText);
    await navigate({
      to: "/app/$feature/preview",
      params: { feature: FeatureFlowEnum.VoiceToText },
    });
  };

  const handleInputChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const rawFiles = e.target.files;
    if (rawFiles) handleAddFiles(Array.from(rawFiles));
  };

  const handleOpenInput = () => inputRef.current?.click();

  // biome-ignore lint/correctness/useExhaustiveDependencies: only on mount
  useEffect(() => {
    queryClient.removeQueries({ queryKey: ["transcribe"] });
    transcriptionDispatch(clearTranscriptions());
  }, []);

  return (
    <>
      <Header
        feature={FeatureFlowEnum.VoiceToText}
        currentStep={tutorialSeen ? 1 : undefined}
      />
      <MainContent full={tutorialSeen}>
        {tutorialSeen ? (
          <FileSelectionLayout title={t("onboarding.sectionTitle")}>
            <FileDropZone
              icon={<VoiceIcon />}
              title={t("onboarding.dropAreaTitle")}
              description={t("onboarding.dropAreaFormats")}
              onDrop={(files) => {
                const allowedFiles = files.filter((file) =>
                  isAllowed(file, MEDIA_EXTENSIONS),
                );
                if (allowedFiles.length > 0) handleAddFiles(allowedFiles);
              }}
              onClick={handleOpenInput}
            />
          </FileSelectionLayout>
        ) : (
          <HowItWorks feature={FeatureFlowEnum.VoiceToText} />
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
        extensions={MEDIA_EXTENSIONS}
        multiple
      />
    </>
  );
}
