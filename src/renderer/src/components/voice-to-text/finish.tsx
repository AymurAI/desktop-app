import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import FeaturesMenu from "@/components/features-menu";
import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import MainContent from "@/components/layout/main-content";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import RequireFile from "@/features/RequireFile";
import { useTranscriptions } from "@/hooks/useTranscriptions";
import { SectionTitle } from "@/layout/section-title";
import { HStack, Stack, styled } from "@/styled/jsx";
import { FeatureFlowEnum } from "@/types/features";
import { formatTime } from "./format-time";
import VoiceStepper from "./stepper";

export default function VoiceFinish() {
  const { t } = useTranslation("voice-to-text");
  const navigate = useNavigate();
  const transcriptions = useTranscriptions();
  const transcription = transcriptions[0];

  const handleDownloadTxt = () => {
    if (!transcription) return;

    const lines = transcription.turns.map((turn) => {
      const speaker = transcription.speakers.find(
        (s) => s.id === turn.speakerId,
      );
      const time = formatTime(turn.startMs);
      return `[${time}] ${speaker?.label ?? "Persona"}: ${turn.text}`;
    });

    const content = lines.join("\n\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${transcription.title.replace(/[^a-zA-Z0-9\s]/g, "")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <RequireFile>
      <Header
        title={t("title")}
        right={<FeaturesMenu />}
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
          <Button onClick={handleDownloadTxt} disabled={!transcription}>
            {t("finish.download")}
          </Button>
        </HStack>
      </Footer>
    </RequireFile>
  );
}
