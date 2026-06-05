import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { type ChangeEventHandler, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import HiddenInput from "@/components/hidden-input";
import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import MainContent from "@/components/layout/main-content";
import BackButton from "@/components/ui/back-button";
import Button from "@/components/ui/button";
import VoiceFileDrop from "@/components/voice-to-text/file-drop";
import { VoiceHowItWorksGrid } from "@/components/voice-to-text/how-it-works";
import VoiceStepper from "@/components/voice-to-text/stepper";
import { AUDIO_EXTENSIONS } from "@/constants/config";
import { useFileDispatch } from "@/hooks";
import { SectionTitle } from "@/layout/section-title";
import { addFiles } from "@/reducers/file/actions";
import { useSetTutorialSeen, useTutorialSeen } from "@/store/useLocal";
import { HStack, Stack } from "@/styled/jsx";
import { FeatureFlowEnum } from "@/types/features";

export default function VoiceOnboarding() {
  const { t } = useTranslation("voice-to-text");
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const inputRef = useRef<HTMLInputElement>(null);
  const dispatch = useFileDispatch();
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
  }, []);

  return (
    <>
      <Header
        title={t("title")}
        feature={FeatureFlowEnum.VoiceToText}
        center={tutorialSeen ? <VoiceStepper current={1} /> : undefined}
      />
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
          <Stack gap="8">
            <SectionTitle>{t("howItWorks.pageTitle")}</SectionTitle>
            <VoiceHowItWorksGrid />
          </Stack>
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
        extensions={AUDIO_EXTENSIONS}
        multiple
      />
    </>
  );
}
