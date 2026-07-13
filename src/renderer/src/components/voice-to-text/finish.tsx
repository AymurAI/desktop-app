import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import MainContent from "@/components/layout/main-content";
import MenuButton from "@/components/ui/button";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import RequireFile from "@/features/RequireFile";
import { useTranscriptions } from "@/hooks/useTranscriptions";
import { SectionTitle } from "@/layout/section-title";
import type { ExportFormat } from "@/services/export/types";
import { useExportTranscription } from "@/services/export/use-export-transcription";
import { HStack, Stack, styled } from "@/styled/jsx";
import { FeatureFlowEnum } from "@/types/features";
import { Button, Card } from "@aymurai/ui";
import VoiceStepper from "./stepper";

export default function VoiceFinish() {
  const { t } = useTranslation("voice-to-text");
  const navigate = useNavigate();
  const transcriptions = useTranscriptions();
  const transcription = transcriptions[0] ?? null;
  const { isExporting, download } = useExportTranscription(transcription);

  const formats: { format: ExportFormat; label: string }[] = [
    { format: "txt", label: t("finish.downloadTxt") },
    { format: "odt", label: t("finish.downloadOdt") },
    { format: "pdf", label: t("finish.downloadPdf") },
  ];

  return (
    <RequireFile>
      <Header
        title={t("title")}
        feature={FeatureFlowEnum.VoiceToText}
        center={<VoiceStepper current={4} />}
      />
      <MainContent>
        <Stack gap="6">
          <SectionTitle>{t("finish.sectionTitle")}</SectionTitle>
          {transcription ? (
            <>
              <styled.p textStyle="paragraph.md.default" maxWidth="3xl">
                {t("finish.description")}
              </styled.p>
              <Card>
                <Stack gap="2">
                  <styled.h2 textStyle="subtitle.md.strong">
                    {t("finish.summaryTitle")}
                  </styled.h2>
                  <Stack gap="1">
                    <styled.p textStyle="paragraph.sm.default">
                      <strong>{t("finish.titleLabel")}:</strong>{" "}
                      {transcription.title}
                    </styled.p>
                    <styled.p textStyle="paragraph.sm.default">
                      <strong>{t("finish.fileLabel")}:</strong>{" "}
                      {transcription.audioFileName}
                    </styled.p>
                    <styled.p textStyle="paragraph.sm.default">
                      <strong>{t("finish.speakersLabel")}:</strong>{" "}
                      {transcription.speakers.length}
                    </styled.p>
                    <styled.p textStyle="paragraph.sm.default">
                      <strong>{t("finish.turnsLabel")}:</strong>{" "}
                      {transcription.turns.length}
                    </styled.p>
                  </Stack>
                </Stack>
              </Card>
            </>
          ) : (
            <styled.p textStyle="paragraph.md.default">
              {t("finish.missing")}
            </styled.p>
          )}
        </Stack>
      </MainContent>
      <Footer withBuiltBy>
        <HStack gap="4">
          <Button
            variant="secondary"
            onClick={() =>
              navigate({
                to: "/app/$feature/validation",
                params: { feature: FeatureFlowEnum.VoiceToText },
              })
            }
          >
            {t("finish.back")}
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button disabled={!transcription} isLoading={isExporting}>
                {t("finish.download")}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end">
              <Stack gap="1" p="2" minWidth="[160px]">
                {formats.map(({ format, label }) => (
                  <PopoverClose key={format} asChild>
                    <MenuButton variant="none" onClick={() => download(format)}>
                      {label}
                    </MenuButton>
                  </PopoverClose>
                ))}
              </Stack>
            </PopoverContent>
          </Popover>
        </HStack>
      </Footer>
    </RequireFile>
  );
}
