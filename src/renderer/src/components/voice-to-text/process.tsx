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
  overflowY: "auto",
  borderWidth: "[1px]",
  borderStyle: "solid",
  borderColor: "[#E5E3E0]",
  rounded: "lg",
  py: "5",
  px: "6",
  bg: "[rgba(255, 255, 255, 0.6)]",
  boxSizing: "border-box",
});

const previewText = css({
  m: "[0]",
  fontWeight: "[300]",
  fontSize: "[18px]",
  lineHeight: "[30px]",
  color: "text.lighter",
  whiteSpace: "pre-wrap",
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

  // Show the latest partial text in a plain scrollable preview that updates as
  // each new fragment streams in.
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    setDisplayedText(partialText);
  }, [partialText]);

  useEffect(() => {
    if (status === "idle" || status === "stopped" || status === "error") {
      setDisplayedText("");
    }
  }, [status]);

  // Keep the newest fragment in view by sticking to the bottom, but stop
  // following once the user scrolls up to re-read earlier text.
  const previewRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);

  const handlePreviewScroll = () => {
    const el = previewRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = distanceFromBottom < 40;
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: displayedText is the trigger — re-scroll to the bottom whenever new text streams in
  useEffect(() => {
    if (!stickToBottomRef.current) return;
    const el = previewRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [displayedText]);

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
                    ref={previewRef}
                    className={previewViewport}
                    onScroll={handlePreviewScroll}
                    aria-live="polite"
                    aria-label={t("process.previewAriaLabel")}
                  >
                    {displayedText ? (
                      <p className={previewText}>{displayedText}</p>
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
