import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import MainContent from "@/components/layout/main-content";
import BackButton from "@/components/ui/back-button";
import ScrollArea from "@/components/ui/scroll-area";
import { useSummary, useSummaryDispatch } from "@/context/Summary";
import RequireFile from "@/features/RequireFile";
import { useFiles } from "@/hooks";
import { useSummarize } from "@/hooks/useSummarize";
import { SectionTitle } from "@/layout/section-title";
import { css } from "@/styled/css";
import { HStack, Stack, styled } from "@/styled/jsx";
import { FeatureFlowEnum } from "@/types/features";
import { Button, Callout, Card, Spinner } from "@aymurai/ui";
import { useNavigate } from "@tanstack/react-router";
import { Info } from "phosphor-react";
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

export default function SummaryProcess() {
  const { t } = useTranslation("summarizer");
  const navigate = useNavigate();
  const files = useFiles();
  const file = files[0];
  const dispatch = useSummaryDispatch();
  const summary = useSummary();
  const { status, abort } = useSummarize(file, { dispatch });

  const isCompleted = status === "completed";
  const isError = status === "error";
  const isStopped = status === "stopped";

  const handleStop = () => abort();

  const handlePrevious = () =>
    navigate({
      to: "/app/$feature/preview",
      params: { feature: FeatureFlowEnum.Summarizer },
    });

  const handleNext = () =>
    navigate({
      to: "/app/$feature/validation",
      params: { feature: FeatureFlowEnum.Summarizer },
    });

  return (
    <RequireFile>
      <Header feature={FeatureFlowEnum.Summarizer} currentStep={2} />
      <MainContent>
        <Stack gap="10">
          <HStack alignItems="center" gap="6">
            <BackButton
              to="/app/$feature/preview"
              params={{ feature: FeatureFlowEnum.Summarizer }}
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
                {!isCompleted && !isError && !isStopped && <Spinner />}

                {!isError ? (
                  <ScrollArea
                    className={previewFrame}
                    aria-live="polite"
                    aria-label={t("process.previewAriaLabel")}
                  >
                    <div className={previewContent}>
                      {summary.partialText ? (
                        <p className={previewText}>{summary.partialText}</p>
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
                      <Callout
                        message={t("process.error")}
                        variant="error"
                        size="compact"
                        noBorder
                      />
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
          {!isCompleted && !isError && !isStopped && (
            <Button variant="secondary" onClick={handleStop}>
              {t("process.stop")}
            </Button>
          )}
          <Button onClick={handleNext} disabled={!isCompleted}>
            {t("process.next")}
          </Button>
        </HStack>
      </Footer>
    </RequireFile>
  );
}
