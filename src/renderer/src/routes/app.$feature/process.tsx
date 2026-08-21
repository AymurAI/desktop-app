import { FileProcessing } from "@/components";
import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import MainContent from "@/components/layout/main-content";
import BackButton from "@/components/ui/back-button";
import RequireFile from "@/features/RequireFile";
import { useFileDispatch, useFiles } from "@/hooks";
import { useDisambiguate } from "@/hooks/useDisambiguate";
import { useFileParse } from "@/hooks/useFileParse";
import { type PredictStatus, usePredict } from "@/hooks/usePredict";
import { SectionTitle } from "@/layout/section-title";
import { filterUnprocessed } from "@/reducers/file/actions";
import taskbar from "@/services/taskbar";
import { css } from "@/styled/css";
import { HStack, Stack, styled } from "@/styled/jsx";
import type { Workflows } from "@/types/aymurai";
import { FeatureFlowEnum, featureNamespace } from "@/types/features";
import type { DocFile } from "@/types/file";
import { Button, Callout, Card } from "@aymurai/ui";
import { useQueryClient } from "@tanstack/react-query";
import {
  createFileRoute,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import SummaryProcess from "@/components/summarizer/summary-process";
import VoiceProcess from "@/components/voice-to-text/process";

export const Route = createFileRoute("/app/$feature/process")({
  component: RouteComponent,
});

function RouteComponent() {
  const { feature } = useParams({
    from: "/app/$feature/process",
  });
  if (feature === FeatureFlowEnum.VoiceToText) return <VoiceProcess />;
  if (feature === FeatureFlowEnum.Summarizer) return <SummaryProcess />;
  return <DocumentProcess />;
}

function DocumentProcess() {
  const queryClient = useQueryClient();
  const { feature } = useParams({
    from: "/app/$feature/process",
  });
  const { t } = useTranslation(featureNamespace[feature]);

  const dispatch = useFileDispatch();
  const navigate = useNavigate();
  const files = useFiles();

  const [isDismissed, setIsDismissed] = useState(false);
  const hasNotified = useRef(false);

  const workflow: Workflows =
    feature === FeatureFlowEnum.Anonymizer ? "anonymizer" : "datapublic";
  const parseStatuses = useFileParse(files);
  const fileStatuses = usePredict(files, workflow);
  const disambiguateStatuses = useDisambiguate(
    files,
    fileStatuses,
    workflow === "anonymizer",
  );

  const handleNext = () => {
    dispatch(filterUnprocessed());
    navigate({
      to: "/app/$feature/validation",
      params: { feature },
    });
  };

  // Status accounts for all three stages so "completed" only shows at 100%.
  // This is the ONLY source of per-file status: `isProcessing`/`hasError`/
  // `isDone` below all derive from it. Looking at a single stage's table (or
  // recomputing an equivalent by hand) reintroduces G8 F3 by another door -
  // e.g. `usePredict` reports "completed" once a file has 0 paragraphs
  // (`total === 0`, meaning parse hasn't produced any yet), so a naive
  // `fileStatuses[...]?.status === "error"` check would miss parse errors.
  const getCombinedStatus = (fileName: string): PredictStatus => {
    const parseStatus = parseStatuses[fileName]?.status ?? "processing";
    if (parseStatus !== "completed") return parseStatus;

    const predictStatus = fileStatuses[fileName]?.status ?? "processing";
    if (workflow !== "anonymizer" || predictStatus !== "completed")
      return predictStatus;

    return disambiguateStatuses[fileName]?.status ?? "processing";
  };

  const combinedStatuses = files.map((f) => getCombinedStatus(f.data.name));
  const isProcessing = combinedStatuses.some((s) => s === "processing");
  // "stopped" (the user aborted this file) is folded into the same
  // non-success branch as "error": an aborted file must never show the
  // success banner, and this Callout doesn't need to distinguish "the model
  // failed" from "you cancelled it" - both mean "this run did not finish
  // successfully", which is what `process.errorText` says in both locales.
  const hasError = combinedStatuses.some(
    (s) => s === "error" || s === "stopped",
  );
  const isDone = files.length > 0 && !isProcessing && !hasError;

  useEffect(() => {
    // Fires once processing genuinely stops, success OR error - previously
    // this read a hand-rolled `isProcessing` that, for the Anonimizador,
    // stayed `true` forever once predict errored (see G8 F3), so a failed
    // run never notified. Deriving from `getCombinedStatus` fixes that as a
    // side effect: a run that ends entirely in error now DOES notify, same
    // as a successful one - the user still needs to know the run is over.
    if (files.length > 0 && !isProcessing && !hasNotified.current) {
      hasNotified.current = true;
      taskbar.notify();
    }
  }, [isProcessing, files.length]);

  // Weighted progress: 10% parse / 70% predict / 20% disambiguate (anonymizer)
  // or 10% parse / 90% predict (datapublic).
  const getProgress = (fileName: string): number => {
    const parseDone = parseStatuses[fileName]?.status === "completed" ? 1 : 0;
    const predictProgress = fileStatuses[fileName]?.progress ?? 0;

    if (workflow !== "anonymizer") {
      return parseDone * 0.1 + predictProgress * 0.9;
    }
    const disambiguateDone =
      disambiguateStatuses[fileName]?.status === "completed" ? 1 : 0;
    return parseDone * 0.1 + predictProgress * 0.7 + disambiguateDone * 0.2;
  };

  const handleAbort = (file: DocFile) => () => {
    queryClient.removeQueries({
      queryKey: ["file-parser", file.data.name],
      exact: false,
    });
    queryClient.removeQueries({
      queryKey: ["predict", feature, file.data.name],
      exact: false,
    });
    fileStatuses[file.data.name]?.abort?.();
    parseStatuses[file.data.name]?.abort?.();
  };

  return (
    <RequireFile>
      <Header title={t("title")} feature={feature} currentStep={2} />
      <MainContent>
        <Stack gap="10">
          <HStack alignItems="center" gap="6">
            <BackButton to="/app/$feature/preview" params={{ feature }} />
            <SectionTitle>{t("process.sectionTitle")}</SectionTitle>
          </HStack>
          <Card className={css({ alignItems: "stretch" })}>
            <Stack gap="6" direction="column">
              <Stack direction="column" gap="1">
                <styled.h2 textStyle="subtitle.md.default">
                  {isDone
                    ? t("process.finishedTitle")
                    : hasError
                      ? t("process.errorTitle")
                      : t("process.processingTitle")}
                </styled.h2>
                <styled.p textStyle="subtitle.sm.default" color="text.lighter">
                  {isDone
                    ? t("process.finishedSubtitle")
                    : hasError
                      ? t("process.errorSubtitle")
                      : t("process.processingSubtitle")}
                </styled.p>
              </Stack>
              {isDone && !isDismissed && (
                <Callout
                  message={t("process.finishText")}
                  variant="info"
                  noBorder
                  onDismiss={() => setIsDismissed(true)}
                />
              )}
              {hasError && !isDismissed && (
                <Callout
                  message={t("process.errorText")}
                  variant="error"
                  noBorder
                  onDismiss={() => setIsDismissed(true)}
                />
              )}
              {files.map((f) => (
                <FileProcessing
                  key={f.data.name}
                  fileName={f.data.name}
                  status={getCombinedStatus(f.data.name)}
                  progress={getProgress(f.data.name)}
                  onAbort={handleAbort(f)}
                />
              ))}
            </Stack>
          </Card>
        </Stack>
      </MainContent>
      <Footer withBuiltBy>
        <Button onClick={handleNext} disabled={isProcessing}>
          {t("process.next")}
        </Button>
      </Footer>
    </RequireFile>
  );
}
