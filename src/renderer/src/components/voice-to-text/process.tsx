import { useNavigate } from "@tanstack/react-router";
import { Info } from "phosphor-react";
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
import {
  ArchiveProgress,
  type ArchiveProgressStatus,
  Button,
  Card,
} from "@aymurai/ui";
import VoiceStepper from "./stepper";

// @aymurai/ui ArchiveProgress always renders a "Descartar" (✕) button, which the
// Figma transcription screen does not include. Hide it from the consumer until
// the library makes it conditional.
const hideDismiss = css({
  "& button[aria-label='Descartar']": { display: "none" },
});

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
  const isStopped = status === "stopped";
  const progressPercent = Math.round(progress * 100);

  // Map our transcription status onto @aymurai/ui ArchiveProgress states.
  const archiveStatus: ArchiveProgressStatus = isCompleted
    ? "completed"
    : isError
      ? "error"
      : isStopped
        ? "stopped"
        : "default";

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
                <ArchiveProgress
                  className={hideDismiss}
                  fileName={files[0]?.data.name}
                  progress={isCompleted ? 100 : progressPercent}
                  status={archiveStatus}
                  onStop={handleStop}
                  onReplace={handleReplaceClick}
                />

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

                {!isError && !isStopped && (
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
