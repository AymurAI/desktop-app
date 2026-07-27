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
import taskbar from "@/services/taskbar";
import { css } from "@/styled/css";
import { HStack, Stack, styled } from "@/styled/jsx";
import { FeatureFlowEnum } from "@/types/features";
import { Button, Callout, Card, CheckCircle, Spinner } from "@aymurai/ui";
import { useNavigate } from "@tanstack/react-router";
import { Info } from "phosphor-react";
import { useEffect, useRef } from "react";
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

const spinnerSlot = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: "0",
  w: "12",
  h: "12",
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

  // Play the completion sound + taskbar bounce once when the summary
  // finishes, matching the Dataset/Anonimizador/Voz a texto pipelines.
  const hasNotified = useRef(false);
  useEffect(() => {
    if (isCompleted && !hasNotified.current) {
      hasNotified.current = true;
      taskbar.notify();
    }
  }, [isCompleted]);

  // Keep the newest streamed fragment in view by sticking to the bottom,
  // but stop following once the user scrolls up to re-read earlier text —
  // same pattern as voice-to-text/process.tsx.
  const previewRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);

  const handlePreviewScroll = () => {
    const el = previewRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = distanceFromBottom < 40;
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: summary.partialText is the trigger — re-scroll to the bottom whenever new text streams in
  useEffect(() => {
    if (!stickToBottomRef.current) return;
    const el = previewRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [summary.partialText]);

  const handleStop = () => abort();

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
              <HStack justifyContent="space-between" alignItems="center">
                <Stack gap="1">
                  <styled.h2 textStyle="subtitle.md.default">
                    {t("process.processingTitle")}
                  </styled.h2>
                  <styled.p
                    textStyle="subtitle.sm.default"
                    color="text.lighter"
                  >
                    {t("process.processingSubtitle")}
                  </styled.p>
                </Stack>
                <HStack gap="4" alignItems="center">
                  {!isCompleted && !isError && !isStopped && (
                    <Button variant="secondary" onClick={handleStop}>
                      {t("process.stop")}
                    </Button>
                  )}
                  <div className={spinnerSlot}>
                    {!isCompleted && !isError && !isStopped && <Spinner />}
                    {isCompleted && (
                      <CheckCircle aria-label={t("process.completedAria")} />
                    )}
                  </div>
                </HStack>
              </HStack>

              <Stack gap="3">
                {!isError ? (
                  <ScrollArea
                    className={previewFrame}
                    viewportRef={previewRef}
                    onScroll={handlePreviewScroll}
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
        <Button onClick={handleNext} disabled={!isCompleted}>
          {t("process.next")}
        </Button>
      </Footer>
    </RequireFile>
  );
}
