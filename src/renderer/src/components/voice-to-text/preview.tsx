import { useNavigate } from "@tanstack/react-router";
import { Pause, Play, Trash } from "phosphor-react";
import { useTranslation } from "react-i18next";

import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
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
import { formatFileSize } from "@/utils/file";
import { ArchiveRow, Button, Card } from "@aymurai/ui";

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
    <ArchiveRow
      variant="outlined"
      title={file.data.name}
      description={t("preview.meta", {
        duration: formatDuration(displayedDurationMs),
        size: formatFileSize(file.data.size),
      })}
      leadingAction={
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
      }
      trailingAction={
        <button
          type="button"
          onClick={onRemove}
          aria-label={t("preview.removeAria", { name: file.data.name })}
          className={removeButton}
        >
          <Trash size={24} />
        </button>
      }
    />
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
      <Header feature={FeatureFlowEnum.VoiceToText} currentStep={1} />
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
