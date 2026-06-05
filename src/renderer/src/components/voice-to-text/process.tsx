import { useNavigate } from "@tanstack/react-router";
import { ArrowsClockwise, CheckCircle, Info } from "phosphor-react";
import {
  type ChangeEventHandler,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import HiddenInput from "@/components/hidden-input";
import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import MainContent from "@/components/layout/main-content";
import BackButton from "@/components/ui/back-button";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import { AUDIO_EXTENSIONS } from "@/constants/config";
import RequireFile from "@/features/RequireFile";
import { useFileDispatch, useFiles } from "@/hooks";
import { useTranscribe } from "@/hooks/useTranscribe";
import { useTranscriptionDispatch } from "@/hooks/useTranscriptions";
import { SectionTitle } from "@/layout/section-title";
import { addFiles, removeAllFiles } from "@/reducers/file/actions";
import { css } from "@/styled/css";
import { HStack, Stack, styled } from "@/styled/jsx";
import { FeatureFlowEnum } from "@/types/features";
import VoiceStepper from "./stepper";

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
  height: "[10px]",
  bg: "bg.secondary-highlight",
  rounded: "full",
  overflow: "hidden",
});

const barProcessing = css({
  height: "full",
  rounded: "full",
  transition: "[width 200ms ease]",
  backgroundSize: "[32px 32px]",
  backgroundImage:
    "[linear-gradient(135deg, #3F479D 37.5%, #C5CAFF 37.5%, #C5CAFF 50%, #3F479D 50%, #3F479D 87.5%, #C5CAFF 87.5%, #C5CAFF 100%)]",
});

const barError = css({
  height: "full",
  width: "full",
  rounded: "full",
  bg: "system.error-secondary",
});

const calloutBox = css({
  display: "flex",
  alignItems: "center",
  gap: "3",
  px: "4",
  py: "3",
  rounded: "md",
  bg: "bg.secondary-highlight",
  color: "text.default",
});

const stopButton = css({
  display: "flex",
  alignItems: "center",
  gap: "2",
  px: "4",
  py: "2",
  rounded: "md",
  borderWidth: "[1px]",
  borderStyle: "solid",
  borderColor: "brand.primary",
  bg: "bg.secondary",
  color: "brand.primary",
  cursor: "pointer",
  whiteSpace: "nowrap",
  "&:hover": { bg: "bg.secondary-highlight" },
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
  const fileDispatch = useFileDispatch();

  const replaceInputRef = useRef<HTMLInputElement>(null);

  const audioFiles = useMemo(() => files.map((f) => f.data), [files]);

  const { progress, status, partialText, abort } = useTranscribe(audioFiles, {
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
    if (status === "idle" || status === "stopped" || status === "error") {
      setDisplayedText("");
      pendingTextRef.current = "";
    }
  }, [status]);

  const previewDuration = useMemo(
    () => estimateScrollDuration(displayedText),
    [displayedText],
  );

  const handleTrackIteration = () => {
    if (pendingTextRef.current && pendingTextRef.current !== displayedText) {
      setDisplayedText(pendingTextRef.current);
    }
  };

  const handleStop = () => abort();

  const handleReplaceClick = () => replaceInputRef.current?.click();

  const handleReplaceFiles: ChangeEventHandler<HTMLInputElement> = (e) => {
    const raw = e.target.files;
    if (!raw || raw.length === 0) return;
    fileDispatch(removeAllFiles());
    fileDispatch(addFiles(Array.from(raw)));
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
      {/* TODO: move voice-to-text-preview-scroll keyframe to panda.config.ts theme.extend.keyframes */}
      <style>
        {
          "@keyframes voice-to-text-preview-scroll { 0% { transform: translateY(100%); } 100% { transform: translateY(-100%); } }"
        }
      </style>
      <Header
        title={t("title")}
        feature={FeatureFlowEnum.VoiceToText}
        center={<VoiceStepper current={2} />}
      />
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

              <Stack gap="3">
                <HStack
                  justifyContent="space-between"
                  alignItems="center"
                  gap="4"
                >
                  <styled.span
                    textStyle="label.md.default"
                    color={isError ? "system.error" : "text.default"}
                    truncate
                  >
                    {files[0]?.data.name}
                  </styled.span>

                  <HStack gap="3" alignItems="center" flexShrink="0">
                    {isError ? (
                      <styled.span
                        textStyle="label.md.default"
                        color="system.error"
                        fontStyle="italic"
                      >
                        {t("process.errorLabel")}
                      </styled.span>
                    ) : isCompleted ? (
                      <HStack gap="2" alignItems="center">
                        <CheckCircle
                          size={20}
                          color="#3F479D"
                          weight="regular"
                        />
                        <styled.span
                          textStyle="label.md.default"
                          color="brand.primary"
                        >
                          {t("process.completedLabel")}
                        </styled.span>
                      </HStack>
                    ) : (
                      <styled.span
                        textStyle="label.md.default"
                        color="text.default"
                      >
                        {t("process.progressLabel", {
                          percent: progressPercent,
                        })}
                      </styled.span>
                    )}

                    {isProcessing && (
                      <button
                        type="button"
                        className={stopButton}
                        onClick={handleStop}
                      >
                        <styled.span
                          width="[14px]"
                          height="[14px]"
                          borderWidth="[2px]"
                          borderStyle="solid"
                          borderColor="brand.primary"
                          rounded="[2px]"
                        />
                        {t("process.stop")}
                      </button>
                    )}
                    {isError && (
                      <button
                        type="button"
                        className={stopButton}
                        onClick={handleReplaceClick}
                      >
                        <ArrowsClockwise size={16} />
                        {t("process.replace")}
                      </button>
                    )}
                  </HStack>
                </HStack>

                <div className={barContainer}>
                  {isError ? (
                    <div className={barError} />
                  ) : (
                    <div
                      className={barProcessing}
                      style={{
                        width: `${isCompleted ? 100 : progressPercent}%`,
                      }}
                    />
                  )}
                </div>

                {!isError ? (
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
                ) : (
                  <div className={previewViewport}>
                    <span className={previewPlaceholder}>
                      {t("process.waitingForWords")}
                    </span>
                  </div>
                )}

                {!isError && (
                  <div className={calloutBox}>
                    <Info size={20} color="#3F479D" />
                    <styled.span textStyle="paragraph.sm.default">
                      {t("process.callout")}
                    </styled.span>
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
      <HiddenInput
        ref={replaceInputRef}
        onChange={handleReplaceFiles}
        extensions={AUDIO_EXTENSIONS}
      />
    </RequireFile>
  );
}
