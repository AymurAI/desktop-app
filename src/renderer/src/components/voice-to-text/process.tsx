import HiddenInput from "@/components/hidden-input";
import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import MainContent from "@/components/layout/main-content";
import BackButton from "@/components/ui/back-button";
import ScrollArea from "@/components/ui/scroll-area";
import { MEDIA_EXTENSIONS } from "@/constants/config";
import RequireFile from "@/features/RequireFile";
import { useFileDispatch, useFiles } from "@/hooks";
import { useTranscribe } from "@/hooks/useTranscribe";
import { useTranscriptionDispatch } from "@/hooks/useTranscriptions";
import { SectionTitle } from "@/layout/section-title";
import { addFiles, removeAllFiles } from "@/reducers/file/actions";
import taskbar from "@/services/taskbar";
import { css } from "@/styled/css";
import { HStack, Stack, styled } from "@/styled/jsx";
import { FeatureFlowEnum } from "@/types/features";
import {
  ArchiveProgress,
  type ArchiveProgressStatus,
  Button,
  Callout,
  Card,
} from "@aymurai/ui";
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

const previewFrame = css({
  alignSelf: "stretch",
  width: "full",
  height: "[200px]",
  borderLeft: "primary",
  borderRight: "primary",
  bg: "white",
  boxSizing: "border-box",
});

const previewContent = css({
  width: "full",
  px: "6",
  py: "4",
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
  fontWeight: "[300]",
  fontSize: "[18px]",
  lineHeight: "[30px]",
  color: "[#9F99A5]",
  fontStyle: "italic",
});

export default function VoiceProcess() {
  const { t } = useTranslation("voice-to-text");
  const navigate = useNavigate();
  const files = useFiles();
  const transcriptionDispatch = useTranscriptionDispatch();
  const fileDispatch = useFileDispatch();

  const replaceInputRef = useRef<HTMLInputElement>(null);
  const hasNotified = useRef(false);

  const audioFiles = useMemo(
    () =>
      files.map((file) => ({
        file: file.data,
        durationMs: file.durationMs,
      })),
    [files],
  );

  const { progress, status, partialText, abort } = useTranscribe(audioFiles, {
    dispatch: transcriptionDispatch,
  });

  const isCompleted = status === "completed";
  const isError = status === "error";
  const isStopped = status === "stopped";
  const progressPercent = Math.round(progress * 100);

  // Play the completion sound + taskbar bounce once when the transcription
  // finishes, matching the Dataset/Anonimizador pipelines.
  useEffect(() => {
    if (isCompleted && !hasNotified.current) {
      hasNotified.current = true;
      taskbar.notify();
    }
  }, [isCompleted]);

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
      <Header feature={FeatureFlowEnum.VoiceToText} currentStep={2} />
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
                  fileName={files[0]?.data.name}
                  progress={isCompleted ? 100 : progressPercent}
                  status={archiveStatus}
                  onStop={handleStop}
                  onReplace={handleReplaceClick}
                />

                {!isError ? (
                  <ScrollArea
                    className={previewFrame}
                    viewportRef={previewRef}
                    onScroll={handlePreviewScroll}
                    aria-live="polite"
                    aria-label={t("process.previewAriaLabel")}
                  >
                    <div className={previewContent}>
                      {displayedText ? (
                        <p className={previewText}>{displayedText}</p>
                      ) : (
                        <span className={previewPlaceholder}>
                          {t("process.waitingForWords")}
                        </span>
                      )}
                    </div>
                  </ScrollArea>
                ) : (
                  <ScrollArea className={previewFrame}>
                    <div className={previewContent}>
                      <span className={previewPlaceholder}>
                        {t("process.waitingForWords")}
                      </span>
                    </div>
                  </ScrollArea>
                )}

                {!isError && !isStopped && (
                  <Callout
                    message={t("process.callout")}
                    variant="info"
                    size="compact"
                    icon={Info}
                    noBorder
                  />
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
        extensions={MEDIA_EXTENSIONS}
      />
    </RequireFile>
  );
}
