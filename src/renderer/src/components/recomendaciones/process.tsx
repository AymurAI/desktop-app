import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { FileProcessing } from "@/components";
import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import MainContent from "@/components/layout/main-content";
import BackButton from "@/components/ui/back-button";
import { formatTime } from "@/components/voice-to-text/format-time";
import RequireFile from "@/features/RequireFile";
import { useFiles } from "@/hooks";
import { useDataExtraction } from "@/hooks/useDataExtraction";
import { useFileParse } from "@/hooks/useFileParse";
import type { PredictStatus } from "@/hooks/usePredict";
import { SectionTitle } from "@/layout/section-title";
import taskbar from "@/services/taskbar";
import { css } from "@/styled/css";
import { HStack, Stack, styled } from "@/styled/jsx";
import { FeatureFlowEnum, featureNamespace } from "@/types/features";
import { Button, Callout, Card } from "@aymurai/ui";
import { useNavigate } from "@tanstack/react-router";

/**
 * Recomendaciones' processing step: a simplified, single-file variant of
 * `DocumentProcess` (`routes/app.$feature/process.tsx`). There is no
 * paragraph-by-paragraph prediction here — `useFileParse` gets the document
 * ready for the backend, then `useDataExtraction` decides whether to reuse a
 * stored result or run the LLM extraction (see §4.4 of the design doc).
 */
export default function RecomendacionesProcess() {
  const feature = FeatureFlowEnum.Recomendaciones;
  const { t } = useTranslation(featureNamespace[feature]);
  const navigate = useNavigate();

  const files = useFiles();
  const file = files[0];

  const parseStatuses = useFileParse(files);
  // Safe even before `RequireFile` redirects away on an empty file list: React
  // Query simply stays disabled (no `documentId` to key off of) until then.
  const extraction = useDataExtraction(
    file ?? {
      data: new File([], ""),
      selected: false,
      validationObject: {},
    },
  );

  const hasNotified = useRef(false);

  const parseStatus = file
    ? (parseStatuses[file.data.name]?.status ?? "processing")
    : "processing";

  // A parse can succeed and still yield zero paragraphs (an image-only /
  // scanned PDF: `documentExtractSchema.document` is an unconstrained
  // string[]). `useDataExtraction` then has no `documentId`, reports "idle",
  // and `combinedStatus` would sit on "processing" forever with an inert
  // Stop button. Surface it as a terminal error instead.
  // `useFileParse` reports "completed" a render before its effect dispatches
  // the paragraphs, so `?? 0` would flash this error on every normal
  // document; the explicit `undefined` check distinguishes "not yet
  // dispatched" from "genuinely empty".
  const hasNoExtractableText =
    parseStatus === "completed" &&
    file?.paragraphs !== undefined &&
    file.paragraphs.length === 0;

  const isReady = parseStatus === "completed" && extraction.status === "ready";
  const isError = extraction.status === "error";

  // A real local LLM extraction can take minutes with no numeric progress to
  // report (see `progress` below). Without any moving signal, a healthy slow
  // extraction is indistinguishable from a hang — this is purely an
  // elapsed-time indicator, additive to `progress`/`combinedStatus`.
  const isExtracting =
    parseStatus === "completed" && extraction.status === "loading";
  const [elapsedMs, setElapsedMs] = useState(0);
  useEffect(() => {
    if (!isExtracting) {
      setElapsedMs(0);
      return;
    }
    const startedAt = Date.now();
    setElapsedMs(0);
    const interval = setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, 1000);
    return () => clearInterval(interval);
  }, [isExtracting]);

  // Status accounts for both stages so "completed" only shows once the
  // extraction/retrieval decision has also resolved.
  const combinedStatus: PredictStatus =
    parseStatus !== "completed"
      ? parseStatus
      : hasNoExtractableText
        ? "error"
        : extraction.status === "error"
          ? "error"
          : extraction.status === "ready"
            ? "completed"
            : "processing";

  // No per-paragraph ratio to weight here: it's a single LLM call, so we
  // report an indeterminate 0.5 while it runs and 1 once it's done.
  const progress = isReady ? 1 : 0.5;

  useEffect(() => {
    if (isReady && !hasNotified.current) {
      hasNotified.current = true;
      taskbar.notify();
    }
  }, [isReady]);

  const handleNext = () => {
    navigate({
      to: "/app/$feature/validation",
      params: { feature },
    });
  };

  const handleAbort = () => {
    if (!file) return;
    // `useFileParse`'s abort marks the file as permanently "stopped" (it
    // disables the query for good, see `useFileParse.ts`), so only call it
    // while the parse itself is still running. Once parsing has completed,
    // stopping only concerns the extraction step — aborting the (already
    // finished) parse too would leave `Siguiente` permanently disabled even
    // after a successful "Reintentar", since `isReady` requires
    // `parseStatus === "completed"`.
    if (parseStatus !== "completed") parseStatuses[file.data.name]?.abort();
    extraction.abort();
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
                  {t("process.processingTitle")}
                </styled.h2>
                <styled.p textStyle="subtitle.sm.default" color="text.lighter">
                  {t("process.processingSubtitle")}
                </styled.p>
                {isExtracting && (
                  <styled.p
                    textStyle="subtitle.sm.default"
                    color="text.lighter"
                  >
                    {t("process.extracting", {
                      elapsed: formatTime(elapsedMs),
                    })}
                  </styled.p>
                )}
              </Stack>
              {file && (
                <FileProcessing
                  fileName={file.data.name}
                  status={combinedStatus}
                  progress={progress}
                  onAbort={handleAbort}
                />
              )}
              {(isError || hasNoExtractableText) && (
                <Stack gap="3" direction="column" alignItems="flex-start">
                  <Callout
                    message={t(
                      hasNoExtractableText
                        ? "process.noTextError"
                        : "process.errorText",
                    )}
                    variant="error"
                    noBorder
                  />
                  {/* `extraction.retry()` is a no-op without a `documentId`,
                      which is exactly the zero-paragraph case — rendering
                      Reintentar there would be a dead control. */}
                  {isError && !hasNoExtractableText && (
                    <Button variant="secondary" onClick={extraction.retry}>
                      {t("process.retry")}
                    </Button>
                  )}
                </Stack>
              )}
            </Stack>
          </Card>
        </Stack>
      </MainContent>
      <Footer withBuiltBy>
        <Button onClick={handleNext} disabled={!isReady}>
          {t("process.next")}
        </Button>
      </Footer>
    </RequireFile>
  );
}
