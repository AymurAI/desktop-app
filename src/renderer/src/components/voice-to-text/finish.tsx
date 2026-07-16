import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import Footer from "@/components/layout/footer";
import MainContent from "@/components/layout/main-content";
import Select, { type SelectOption } from "@/components/ui/select";
import Switch from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import RequireFile from "@/features/RequireFile";
import { useTranscriptions } from "@/hooks/useTranscriptions";
import { SectionTitle } from "@/layout/section-title";
import type { ExportFormat } from "@/services/export/types";
import { useExportTranscription } from "@/services/export/use-export-transcription";
import { css } from "@/styled/css";
import { Grid, HStack, Stack, styled } from "@/styled/jsx";
import { FeatureFlowEnum } from "@/types/features";
import { Avatar, Button, Card } from "@aymurai/ui";
import { Info } from "phosphor-react";
import VoiceHeader from "./header";

const formatLabel = css({
  display: "flex",
  alignItems: "center",
  gap: "1",
});

const switchRow = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "4",
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
  bg: "bg.secondary-highlight",
  rounded: "full",
  py: "1",
  px: "2",
});

const FORMAT_OPTIONS: SelectOption[] = [
  { id: "txt", text: ".txt" },
  { id: "odt", text: ".odt" },
  { id: "pdf", text: ".pdf" },
];

export default function VoiceFinish() {
  const { t } = useTranslation("voice-to-text");
  const navigate = useNavigate();
  const transcriptions = useTranscriptions();
  const transcription = transcriptions[0] ?? null;
  const { isExporting, download } = useExportTranscription(transcription);

  const [format, setFormat] = useState<ExportFormat>("txt");
  const [includeSpeakers, setIncludeSpeakers] = useState(true);
  const [includeTimestamps, setIncludeTimestamps] = useState(true);

  const speakersSwitchId = "finish-include-speakers";
  const timestampsSwitchId = "finish-include-timestamps";

  return (
    <RequireFile>
      <VoiceHeader currentStep={4} />
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
              <Grid columns={2} columnGap="8" rowGap="6">
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
                      <strong>{t("finish.turnsLabel")}:</strong>{" "}
                      {transcription.turns.length}
                    </styled.p>
                    <styled.p textStyle="paragraph.sm.default">
                      <strong>{t("finish.speakersLabel")}:</strong>{" "}
                      {transcription.speakers.length}
                    </styled.p>
                  </Stack>
                  <div className={speakerPills}>
                    {transcription.speakers.map((speaker) => (
                      <div key={speaker.id} className={speakerPill}>
                        <Avatar
                          initials={speaker.initials}
                          color={speaker.color}
                          size="sm"
                        />
                        <styled.span textStyle="label.sm.default">
                          {speaker.label}
                        </styled.span>
                      </div>
                    ))}
                  </div>
                </Stack>

                <Stack gap="6">
                  <Stack gap="2">
                    <TooltipProvider>
                      <HStack className={formatLabel} gap="1">
                        <styled.span
                          textStyle="label.sm.default"
                          color="text.lighter"
                        >
                          {t("finish.formatLabel")}
                        </styled.span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              aria-label={t("finish.formatHelpAria")}
                              className={css({
                                display: "inline-flex",
                                color: "text.lighter",
                                border: "[none]",
                                bg: "transparent",
                                cursor: "pointer",
                                p: "[0]",
                              })}
                            >
                              <Info size={16} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {t("finish.formatHelp")}
                          </TooltipContent>
                        </Tooltip>
                      </HStack>
                    </TooltipProvider>
                    <Select
                      options={FORMAT_OPTIONS}
                      value={format}
                      onChange={(opt) => setFormat(opt.id as ExportFormat)}
                    />
                  </Stack>

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
