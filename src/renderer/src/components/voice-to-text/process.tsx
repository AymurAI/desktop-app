import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import MainContent from "@/components/layout/main-content";
import BackButton from "@/components/ui/back-button";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import RequireFile from "@/features/RequireFile";
import { useFiles } from "@/hooks";
import { useTranscribe } from "@/hooks/useTranscribe";
import { useTranscriptionDispatch } from "@/hooks/useTranscriptions";
import { SectionTitle } from "@/layout/section-title";
import { css } from "@/styled/css";
import { HStack, Stack, styled } from "@/styled/jsx";
import { FeatureFlowEnum } from "@/types/features";

const previewViewport = css({
  position: "relative",
  alignSelf: "stretch",
  width: "full",
  height: "[240px]",
  overflow: "hidden",
  borderWidth: "[1px]",
  borderStyle: "solid",
  borderColor: "[#E5E3E0]",
  rounded: "lg",
  py: "5",
  px: "6",
  bg: "[rgba(255, 255, 255, 0.6)]",
  boxSizing: "border-box",
  maskImage:
    "[linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%)]",
  WebkitMaskImage:
    "[linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%)]",
});

const previewTrack = css({
  position: "absolute",
  left: "6",
  right: "6",
  fontWeight: "[300]",
  fontSize: "[18px]",
  lineHeight: "[30px]",
  color: "text.lighter",
  whiteSpace: "pre-wrap",
  willChange: "[transform]",
  animationName: "[voice-to-text-preview-scroll]",
  animationTimingFunction: "linear",
  animationIterationCount: "infinite",
});

const previewPlaceholder = css({
  position: "absolute",
  inset: "[20px 24px]",
  fontWeight: "[300]",
  fontSize: "[18px]",
  lineHeight: "[30px]",
  color: "[#9F99A5]",
  fontStyle: "italic",
});

const barContainer = css({
  width: "full",
  height: "2",
  bg: "bg.secondary-highlight",
  rounded: "full",
  overflow: "hidden",
});

const bar = css({
  height: "full",
  bg: "brand.primary",
  rounded: "full",
  transition: "[width 200ms ease]",
});

// ~25ms per character so the preview scrolls at a brisk but readable pace,
// clamped so very short or very long texts still feel right.
function estimateScrollDuration(text: string): number {
  const chars = text.length || 1;
  return Math.max(6, Math.min(40, chars * 0.025));
}

export default function VoiceProcess() {
  const { t } = useTranslation("voice-to-text");
  const navigate = useNavigate();
  const files = useFiles();
  const transcriptionDispatch = useTranscriptionDispatch();

  const audioFiles = useMemo(() => files.map((f) => f.data), [files]);

  const { progress, status, partialText } = useTranscribe(audioFiles, {
    dispatch: transcriptionDispatch,
  });

  const isCompleted = status === "completed";
  const isError = status === "error";
  const isProcessing = status === "processing";
  const progressPercent = Math.round(progress * 100);

  // Show the latest partial text in the preview, but only swap it in once the
  // current scroll loop completes — otherwise each SSE update would cut the
  // animation mid-flight and leave the track perpetually starting from off-screen.
  const [displayedText, setDisplayedText] = useState("");
  const pendingTextRef = useRef("");

  useEffect(() => {
    pendingTextRef.current = partialText;
    if (partialText && !displayedText) setDisplayedText(partialText);
  }, [partialText, displayedText]);

  useEffect(() => {
    if (!isProcessing) {
      setDisplayedText("");
      pendingTextRef.current = "";
    }
  }, [isProcessing]);

  const previewDuration = useMemo(
    () => estimateScrollDuration(displayedText),
    [displayedText],
  );

  const handleTrackIteration = () => {
    if (pendingTextRef.current && pendingTextRef.current !== displayedText) {
      setDisplayedText(pendingTextRef.current);
    }
  };

  const handlePrevious = () =>
    navigate({
      to: "/app/$feature/preview",
      params: { feature: FeatureFlowEnum.VoiceToText },
    });

  const handleNext = () =>
    navigate({
      to: "/app/$feature/validation",
      params: { feature: FeatureFlowEnum.VoiceToText },
    });

  return (
    <RequireFile>
      <style>
        {
          "@keyframes voice-to-text-preview-scroll { 0% { transform: translateY(100%); } 100% { transform: translateY(-100%); } }"
        }
      </style>
      <Header title={t("title")} feature={FeatureFlowEnum.VoiceToText} />
      <MainContent>
        <Stack gap="10">
          <HStack alignItems="center" gap="6">
            <BackButton
              to="/app/$feature/preview"
              params={{ feature: FeatureFlowEnum.VoiceToText }}
            />
            <SectionTitle>{t("process.sectionTitle")}</SectionTitle>
          </HStack>
          <Card>
            <Stack gap="6">
              <Stack gap="1">
                <styled.h2 textStyle="subtitle.md.default">
                  {t("process.processingTitle")}
                </styled.h2>
                <styled.p textStyle="subtitle.sm.default" color="text.lighter">
                  {t("process.processingSubtitle")}
                </styled.p>
              </Stack>

              <Stack gap="2">
                <HStack justifyContent="space-between">
                  <styled.span
                    textStyle="label.md.default"
                    color={isError ? "system.error" : "text.default"}
                  >
                    {files.length === 1
                      ? files[0]?.data.name
                      : t("process.nFiles", { count: files.length })}
                  </styled.span>
                  <styled.span
                    textStyle="label.md.default"
                    color={isError ? "system.error" : "text.default"}
                  >
                    {isError
                      ? t("process.errorLabel")
                      : isCompleted
                        ? t("process.completedLabel")
                        : t("process.progressLabel", {
                            percent: progressPercent,
                          })}
                  </styled.span>
                </HStack>
                <div className={barContainer}>
                  <div
                    className={bar}
                    style={{ width: `${isCompleted ? 100 : progressPercent}%` }}
                  />
                </div>

                {isProcessing && (
                  <div
                    className={previewViewport}
                    aria-live="polite"
                    aria-label={t("process.previewAriaLabel")}
                  >
                    {displayedText ? (
                      <div
                        className={previewTrack}
                        style={{ animationDuration: `${previewDuration}s` }}
                        onAnimationIteration={handleTrackIteration}
                      >
                        {displayedText}
                      </div>
                    ) : (
                      <span className={previewPlaceholder}>
                        {t("process.waitingForWords")}
                      </span>
                    )}
                  </div>
                )}
              </Stack>
            </Stack>
          </Card>
        </Stack>
      </MainContent>
      <Footer withBuiltBy>
        <HStack gap="4">
          <Button variant="secondary" onClick={handlePrevious}>
            {t("process.back")}
          </Button>
          <Button onClick={handleNext} disabled={!isCompleted}>
            {t("process.next")}
          </Button>
        </HStack>
      </Footer>
    </RequireFile>
  );
}
