import { useNavigate } from "@tanstack/react-router";
import { Pause, Play, Trash } from "phosphor-react";
import { useTranslation } from "react-i18next";

import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import MainContent from "@/components/layout/main-content";
import BackButton from "@/components/ui/back-button";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import {
  formatDuration,
  useAudioSnippet,
} from "@/components/voice-to-text/use-audio-snippet";
import RequireFile from "@/features/RequireFile";
import { useFileDispatch, useFiles } from "@/hooks";
import { SectionTitle } from "@/layout/section-title";
import { removeFile } from "@/reducers/file/actions";
import { css } from "@/styled/css";
import { HStack, Stack, styled } from "@/styled/jsx";
import { FeatureFlowEnum } from "@/types/features";
import VoiceStepper from "./stepper";

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
  px: "4",
  py: "3",
  rounded: "md",
  borderWidth: "[2px]",
  borderStyle: "solid",
  borderColor: "[#BCBAB8]",
  bg: "bg.secondary",
});

const playButton = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "10",
  height: "10",
  rounded: "md",
  border: "[none]",
  cursor: "pointer",
  flexShrink: "0",
  bg: "bg.secondary-highlight",
  color: "brand.primary",
  "&:hover": { bg: "action.hover", color: "text.onbutton-alternative" },
});

const removeButton = css({
  background: "transparent",
  border: "[none]",
  cursor: "pointer",
  color: "text.lighter",
  p: "2",
  rounded: "md",
  flexShrink: "0",
  "&:hover": { color: "system.error" },
});

function FileRow({ file, onRemove }: { file: File; onRemove: () => void }) {
  const { t } = useTranslation("voice-to-text");
  const { durationMs, isPlaying, toggle } = useAudioSnippet(file);

  return (
    <div className={fileRow}>
      <HStack gap="3" alignItems="center" minWidth="0">
        <button
          type="button"
          className={playButton}
          onClick={toggle}
          aria-label={
            isPlaying
              ? t("preview.pauseAria", { name: file.name })
              : t("preview.playAria", { name: file.name })
          }
        >
          {isPlaying ? (
            <Pause size={20} weight="fill" />
          ) : (
            <Play size={20} weight="fill" />
          )}
        </button>
        <Stack gap="0" minWidth="0">
          <styled.span textStyle="paragraph.sm.strong" truncate>
            {file.name}
          </styled.span>
          <styled.span textStyle="paragraph.sm.default" color="text.lighter">
            {t("preview.meta", {
              duration: formatDuration(durationMs),
              size: formatFileSize(file.size),
            })}
          </styled.span>
        </Stack>
      </HStack>
      <button
        type="button"
        onClick={onRemove}
        aria-label={t("preview.removeAria", { name: file.name })}
        className={removeButton}
      >
        <Trash size={18} />
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
      <Header
        title={t("title")}
        feature={FeatureFlowEnum.VoiceToText}
        center={<VoiceStepper current={1} />}
      />
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
            <Stack gap="4">
              <styled.h2 textStyle="subtitle.md.default">
                {t("preview.selectedCount", { count: files.length })}
              </styled.h2>
              <Stack gap="3">
                {files.map((file) => (
                  <FileRow
                    key={file.data.name}
                    file={file.data}
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
