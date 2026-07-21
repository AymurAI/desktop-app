import { useNavigate } from "@tanstack/react-router";
import { Pause, Play, Trash } from "phosphor-react";
import { useTranslation } from "react-i18next";

import Footer from "@/components/layout/footer";
import MainContent from "@/components/layout/main-content";
import BackButton from "@/components/ui/back-button";
import {
  formatDuration,
  useAudioSnippet,
} from "@/components/voice-to-text/use-audio-snippet";
import RequireFile from "@/features/RequireFile";
import { useFileDispatch, useFiles } from "@/hooks";
import { SectionTitle } from "@/layout/section-title";
import { removeFile, setFileDuration } from "@/reducers/file/actions";
import { css } from "@/styled/css";
import { HStack, Stack, styled } from "@/styled/jsx";
import { FeatureFlowEnum } from "@/types/features";
import type { DocFile } from "@/types/file";
import { Button, Card } from "@aymurai/ui";
import VoiceHeader from "./header";

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} mb`;
  }
  return `${Math.round(bytes / 1024)} kb`;
}

const fileRow = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "4",
  width: "full",
  p: "6",
  rounded: "[8px]",
  borderWidth: "[4px]",
  borderStyle: "solid",
  borderColor: "[#BCBAB8]",
  bg: "bg.secondary",
});

const playButton = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  p: "[9.6px]",
  rounded: "[9.6px]",
  border: "[none]",
  cursor: "pointer",
  flexShrink: "0",
  bg: "bg.primary-alternative",
  color: "brand.primary",
  "&:hover": { bg: "bg.primary-highlight" },
});

const removeButton = css({
  background: "transparent",
  border: "[none]",
  cursor: "pointer",
  color: "text.default",
  p: "0",
  rounded: "md",
  flexShrink: "0",
  "&:hover": { color: "system.error" },
});

function FileRow({ file, onRemove }: { file: DocFile; onRemove: () => void }) {
  const { t } = useTranslation("voice-to-text");
  const dispatch = useFileDispatch();
  const { durationMs, isPlaying, toggle } = useAudioSnippet(file.data, {
    onDuration: (detectedDurationMs) => {
      dispatch(setFileDuration(file.data.name, detectedDurationMs));
    },
  });
  const displayedDurationMs = durationMs || file.durationMs || 0;

  return (
    <div className={fileRow}>
      <HStack gap="3" alignItems="center" minWidth="0">
        <button
          type="button"
          className={playButton}
          onClick={toggle}
          aria-label={
            isPlaying
              ? t("preview.pauseAria", { name: file.data.name })
              : t("preview.playAria", { name: file.data.name })
          }
        >
          {isPlaying ? (
            <Pause size={28} weight="fill" />
          ) : (
            <Play size={28} weight="fill" />
          )}
        </button>
        <Stack gap="1" minWidth="0">
          <styled.span
            textStyle="paragraph.md.default"
            color="text.default"
            truncate
          >
            {file.data.name}
          </styled.span>
          <styled.span textStyle="paragraph.sm.default" color="text.lighter">
            {t("preview.meta", {
              duration: formatDuration(displayedDurationMs),
              size: formatFileSize(file.data.size),
            })}
          </styled.span>
        </Stack>
      </HStack>
      <button
        type="button"
        onClick={onRemove}
        aria-label={t("preview.removeAria", { name: file.data.name })}
        className={removeButton}
      >
        <Trash size={24} />
      </button>
    </div>
  );
}

export default function VoicePreview() {
  const { t } = useTranslation("voice-to-text");
  const navigate = useNavigate();
  const files = useFiles();
  const dispatch = useFileDispatch();

  const handleRemoveFile = (fileName: string) => () => {
    dispatch(removeFile(fileName));
  };

  const handleConfirmFiles = () => {
    navigate({
      to: "/app/$feature/process",
      params: { feature: FeatureFlowEnum.VoiceToText },
    });
  };

  return (
    <RequireFile>
      <VoiceHeader currentStep={1} />
      <MainContent>
        <Stack gap="8">
          <HStack alignItems="center" gap="6">
            <BackButton
              to="/app/$feature/onboarding"
              params={{ feature: FeatureFlowEnum.VoiceToText }}
            />
            <SectionTitle>{t("preview.sectionTitle")}</SectionTitle>
          </HStack>
          <Card>
            <Stack gap="8">
              <styled.h2 textStyle="subtitle.md.default">
                {t("preview.selectedCount", { count: files.length })}
              </styled.h2>
              <Stack gap="3">
                {files.map((file) => (
                  <FileRow
                    key={file.data.name}
                    file={file}
                    onRemove={handleRemoveFile(file.data.name)}
                  />
                ))}
              </Stack>
            </Stack>
          </Card>
        </Stack>
      </MainContent>
      <Footer withBuiltBy>
        <Button onClick={handleConfirmFiles} disabled={files.length === 0}>
          {t("preview.continue")}
        </Button>
      </Footer>
    </RequireFile>
  );
}
