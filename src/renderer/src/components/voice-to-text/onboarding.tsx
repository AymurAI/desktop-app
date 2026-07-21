import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { type ChangeEventHandler, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import HiddenInput from "@/components/hidden-input";
import HowItWorks from "@/components/how-it-works";
import Footer from "@/components/layout/footer";
import MainContent from "@/components/layout/main-content";
import BackButton from "@/components/ui/back-button";
import VoiceFileDrop from "@/components/voice-to-text/file-drop";
import VoiceHeader from "@/components/voice-to-text/header";
import { MEDIA_EXTENSIONS } from "@/constants/config";
import { useFileDispatch } from "@/hooks";
import { useTranscriptionDispatch } from "@/hooks/useTranscriptions";
import { SectionTitle } from "@/layout/section-title";
import { addFiles } from "@/reducers/file/actions";
import { clearTranscriptions } from "@/reducers/transcription/actions";
import { useSetTutorialSeen, useTutorialSeen } from "@/store/useLocal";
import { HStack, Stack } from "@/styled/jsx";
import { FeatureFlowEnum } from "@/types/features";
import { Button } from "@aymurai/ui";

export default function VoiceOnboarding() {
  const { t } = useTranslation("voice-to-text");
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const inputRef = useRef<HTMLInputElement>(null);
  const dispatch = useFileDispatch();
  const transcriptionDispatch = useTranscriptionDispatch();
  const tutorialSeen = useTutorialSeen(FeatureFlowEnum.VoiceToText);
  const toggleTutorialSeen = useSetTutorialSeen();

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
      <VoiceHeader currentStep={tutorialSeen ? 1 : undefined} />
      <MainContent>
        {tutorialSeen ? (
          <Stack gap="8">
            <HStack alignItems="center" gap="6">
              <BackButton to="/home/features" />
              <SectionTitle>{t("onboarding.sectionTitle")}</SectionTitle>
            </HStack>
            <VoiceFileDrop
              onDropFiles={handleAddFiles}
              onClickZone={handleOpenInput}
            />
          </Stack>
        ) : (
          <HowItWorks feature={FeatureFlowEnum.VoiceToText} />
        )}
      </MainContent>
      <Footer withBuiltBy>
        <HStack gap="4">
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
