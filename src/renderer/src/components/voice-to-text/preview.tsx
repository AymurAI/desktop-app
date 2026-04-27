import { useNavigate } from "@tanstack/react-router";
import { FileAudio, Trash } from "phosphor-react";
import { type ChangeEventHandler, useRef } from "react";
import { useTranslation } from "react-i18next";

import HiddenInput from "@/components/hidden-input";
import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import MainContent from "@/components/layout/main-content";
import BackButton from "@/components/ui/back-button";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import RequireFile from "@/features/RequireFile";
import { useFileDispatch, useFiles } from "@/hooks";
import { SectionTitle } from "@/layout/section-title";
import { addFiles, removeFile } from "@/reducers/file/actions";
import { css } from "@/styled/css";
import { HStack, Stack, styled } from "@/styled/jsx";
import { FeatureFlowEnum } from "@/types/features";

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.round(bytes / 1024)} KB`;
}

const fileRow = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "full",
  py: "2",
});

const removeButton = css({
  background: "transparent",
  border: "[none]",
  cursor: "pointer",
  color: "text.lighter",
  p: "2",
  rounded: "md",
  "&:hover": { color: "system.error" },
});

export default function VoicePreview() {
  const { t } = useTranslation("voice-to-text");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const files = useFiles();
  const dispatch = useFileDispatch();

  const handleSelectFile = () => inputRef.current?.click();

  const handleAddedFiles: ChangeEventHandler<HTMLInputElement> = (e) => {
    const rawFiles = e.target.files;
    if (rawFiles) dispatch(addFiles(Array.from(rawFiles)));
  };

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
      <Header title={t("title")} feature={FeatureFlowEnum.VoiceToText} />
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
                {t("preview.filesLabel")}
              </styled.h2>
              <Stack gap="2">
                {files.map((file) => (
                  <div key={file.data.name} className={fileRow}>
                    <HStack gap="3" alignItems="center">
                      <FileAudio size={24} />
                      <Stack gap="0">
                        <styled.span textStyle="paragraph.sm.strong">
                          {file.data.name}
                        </styled.span>
                        <styled.span
                          textStyle="paragraph.sm.default"
                          color="text.lighter"
                        >
                          {formatFileSize(file.data.size)}
                        </styled.span>
                      </Stack>
                    </HStack>
                    <button
                      type="button"
                      onClick={handleRemoveFile(file.data.name)}
                      aria-label={t("preview.removeAria", {
                        name: file.data.name,
                      })}
                      className={removeButton}
                    >
                      <Trash size={18} />
                    </button>
                  </div>
                ))}
              </Stack>
            </Stack>
          </Card>
        </Stack>
      </MainContent>
      <Footer withBuiltBy>
        <HStack gap="4">
          <styled.p textStyle="paragraph.sm.default" whiteSpace="nowrap">
            {t("preview.validFormats")}
          </styled.p>
          <Button variant="secondary" onClick={handleSelectFile}>
            {t("preview.loadMore")}
          </Button>
          <Button onClick={handleConfirmFiles} disabled={files.length === 0}>
            {t("preview.continue")}
          </Button>
        </HStack>
      </Footer>
      <HiddenInput ref={inputRef} onChange={handleAddedFiles} multiple />
    </RequireFile>
  );
}
