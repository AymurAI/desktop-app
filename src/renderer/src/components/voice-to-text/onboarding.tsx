import { useNavigate } from "@tanstack/react-router";
import {
  type ChangeEventHandler,
  type ReactNode,
  useEffect,
  useRef,
} from "react";
import { useTranslation } from "react-i18next";

import HiddenInput from "@/components/hidden-input";
import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import MainContent from "@/components/layout/main-content";
import BackButton from "@/components/ui/back-button";
import Button from "@/components/ui/button";
import { AUDIO_EXTENSIONS } from "@/constants/config";
import { useFileDispatch } from "@/hooks";
import { SectionTitle } from "@/layout/section-title";
import { addFiles } from "@/reducers/file/actions";
import { useSetTutorialSeen, useTutorialSeen } from "@/store/useLocal";
import { css } from "@/styled/css";
import { Grid, HStack, Stack, styled } from "@/styled/jsx";
import { FeatureFlowEnum } from "@/types/features";
import { useQueryClient } from "@tanstack/react-query";

const stepCard = css({
  display: "flex",
  alignItems: "center",
  gap: "4",
  p: "6",
  rounded: "sm",
  border: "primary",
  bg: "bg.secondary",
});

const stepNumber = css({
  width: "10",
  height: "10",
  rounded: "full",
  bg: "bg.primary-highlight",
  color: "text.default",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "[600]",
  flexShrink: "0",
});

function StepCard({ index, text }: { index: number; text: ReactNode }) {
  return (
    <div className={stepCard}>
      <div className={stepNumber}>{index}</div>
      <styled.p textStyle="paragraph.sm.default">{text}</styled.p>
    </div>
  );
}

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
    await navigate({
      to: "/app/$feature/preview",
      params: { feature: FeatureFlowEnum.VoiceToText },
    });
    toggleTutorialSeen(FeatureFlowEnum.VoiceToText);
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

  const steps: ReactNode[] = [
    t("onboarding.steps.step1"),
    t("onboarding.steps.step2"),
    t("onboarding.steps.step3"),
    t("onboarding.steps.step4"),
  ];

  return (
    <>
      <Header title={t("title")} feature={FeatureFlowEnum.VoiceToText} />
      <MainContent>
        <Stack gap="8">
          <HStack alignItems="center" gap="6">
            <BackButton to="/home/features" />
            <SectionTitle>{t("onboarding.description")}</SectionTitle>
          </HStack>
          <Grid columns={2} rowGap="4" columnGap="4">
            {steps.map((s, i) => (
              <StepCard
                // biome-ignore lint/suspicious/noArrayIndexKey: static list
                key={i}
                index={i + 1}
                text={s}
              />
            ))}
          </Grid>
        </Stack>
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
        extensions={AUDIO_EXTENSIONS}
        multiple
      />
    </>
  );
}
