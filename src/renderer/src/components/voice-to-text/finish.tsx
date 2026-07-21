import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import MainContent from "@/components/layout/main-content";
import RequireFile from "@/features/RequireFile";
import { useTranscriptions } from "@/hooks/useTranscriptions";
import { SectionTitle } from "@/layout/section-title";
import type { ExportFormat } from "@/services/export/types";
import { useExportTranscription } from "@/services/export/use-export-transcription";
import { css } from "@/styled/css";
import { Divider, Grid, HStack, Stack, styled } from "@/styled/jsx";
import { FeatureFlowEnum } from "@/types/features";
import {
  Avatar,
  Button,
  Card,
  Select,
  type SelectOption,
  Switch,
  TooltipProvider,
} from "@aymurai/ui";
import { formatDuration } from "./use-audio-snippet";

const switchRow = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "4",
  py: "2",
  borderBottom: "primary",
});

const speakerPills = css({
  display: "flex",
  flexWrap: "wrap",
  gap: "2",
});

const speakerPill = css({
  display: "flex",
  alignItems: "center",
  gap: "2",
  bg: "bg.primary",
  rounded: "full",
  p: "2",
});

const FORMAT_IDS: ExportFormat[] = ["odt", "pdf", "txt"];

export default function VoiceFinish() {
  const { t } = useTranslation("voice-to-text");
  const navigate = useNavigate();
  const transcriptions = useTranscriptions();
  const transcription = transcriptions[0] ?? null;
  const { isExporting, download } = useExportTranscription(transcription);

  const [format, setFormat] = useState<ExportFormat>("odt");
  const [includeSpeakers, setIncludeSpeakers] = useState(true);
  const [includeTimestamps, setIncludeTimestamps] = useState(true);

  const speakersSwitchId = "finish-include-speakers";
  const timestampsSwitchId = "finish-include-timestamps";

  const formatOptions: SelectOption[] = FORMAT_IDS.map((id) => ({
    id,
    text: `.${id}`,
    description: t(`finish.formatDescriptions.${id}`),
  }));

  // Only speakers with at least one turn are "validated" people in this
  // transcription — a speaker created (e.g. via "Nuevo") but never actually
  // used for a turn is an editing artifact, not part of the final result.
  const activeSpeakers =
    transcription?.speakers.filter((speaker) =>
      transcription.turns.some((turn) => turn.speakerId === speaker.id),
    ) ?? [];

  return (
    <RequireFile>
      <Header feature={FeatureFlowEnum.VoiceToText} currentStep={4} />
      <MainContent>
        <Stack gap="6">
          <Stack gap="1">
            <SectionTitle>{t("finish.sectionTitle")}</SectionTitle>
            <styled.p textStyle="paragraph.md.default">
              {t("finish.description")}
            </styled.p>
          </Stack>

          {transcription ? (
            <Card>
              <Grid
                gridTemplateColumns="1fr auto 1fr"
                columnGap="12"
                rowGap="6"
              >
                <Stack gap="4">
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
                      <strong>{t("finish.durationLabel")}:</strong>{" "}
                      {formatDuration(transcription.audioDurationMs)}
                    </styled.p>
                    <styled.p textStyle="paragraph.sm.default">
                      <strong>{t("finish.turnsLabel")}:</strong>{" "}
                      {transcription.turns.length}
                    </styled.p>
                    <styled.p textStyle="paragraph.sm.default">
                      <strong>{t("finish.speakersLabel")}:</strong>{" "}
                      {activeSpeakers.length}
                    </styled.p>
                  </Stack>
                  <div className={speakerPills}>
                    {activeSpeakers.map((speaker) => (
                      <div key={speaker.id} className={speakerPill}>
                        <Avatar
                          initials={speaker.initials}
                          color={speaker.color}
                          size="sm"
                        />
                        <styled.span
                          textStyle="label.md.default"
                          color="text.lighter"
                        >
                          {speaker.label}
                        </styled.span>
                      </div>
                    ))}
                  </div>
                </Stack>

                <Divider
                  orientation="vertical"
                  color="[#BCBAB8]"
                  alignSelf="stretch"
                />

                <Stack gap="6">
                  <styled.h2 textStyle="subtitle.md.strong">
                    {t("finish.exportOptionsTitle")}
                  </styled.h2>

                  <TooltipProvider>
                    <Select
                      options={formatOptions}
                      label={t("finish.formatLabel")}
                      value={format}
                      onChange={(opt) => setFormat(opt.id as ExportFormat)}
                    />
                  </TooltipProvider>

                  <Stack gap="4">
                    <styled.h2 textStyle="subtitle.sm.strong">
                      {t("finish.contentTitle")}
                    </styled.h2>
                    <div className={switchRow}>
                      <label htmlFor={speakersSwitchId}>
                        {t("finish.includeSpeakers")}
                      </label>
                      <Switch
                        id={speakersSwitchId}
                        checked={includeSpeakers}
                        onCheckedChange={setIncludeSpeakers}
                      />
                    </div>
                    <div className={switchRow}>
                      <label htmlFor={timestampsSwitchId}>
                        {t("finish.includeTimestamps")}
                      </label>
                      <Switch
                        id={timestampsSwitchId}
                        checked={includeTimestamps}
                        onCheckedChange={setIncludeTimestamps}
                      />
                    </div>
                  </Stack>
                </Stack>
              </Grid>
            </Card>
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
          <Button
            disabled={!transcription}
            isLoading={isExporting}
            onClick={() =>
              download(format, {
                includeSpeakers,
                includeTimestamps,
                includeTitle: true,
              })
            }
          >
            {t("finish.export")}
          </Button>
        </HStack>
      </Footer>
    </RequireFile>
  );
}
