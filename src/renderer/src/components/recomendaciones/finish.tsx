import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import FileCheck from "@/components/file-check";
import FinishMainContent from "@/components/finish/finish-main-content";
import Footer from "@/components/layout/footer";
import { useFiles } from "@/hooks";
import filesystem from "@/services/filesystem";
import { HStack } from "@/styled/jsx";
import { FeatureFlowEnum, featureNamespace } from "@/types/features";
import { submitRecomendacion } from "@/utils/recomendaciones/submit-recomendacion";
import { localIsoDate } from "@/utils/recomendaciones/to-excel-rows";
import { Button } from "@aymurai/ui";

interface RecomendacionFinishProps {
  onRestart: () => void;
}

/**
 * Recomendaciones' finish step: mirrors `finish-dataset.tsx`. On mount,
 * submits the already-validated `RecomendacionState` per file to the shared
 * `.xlsx` (upsert by `DOCUMENT_ID`, see `submitRecomendacion`).
 */
export default function RecomendacionFinish({
  onRestart,
}: RecomendacionFinishProps) {
  const feature = FeatureFlowEnum.Recomendaciones;
  const { t } = useTranslation(featureNamespace[feature]);
  const files = useFiles();

  const [errorNames, setErrorNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const checkForErrors = (fileName: string) =>
    !!errorNames.find((name) => name === fileName);

  // At first render, submit all the validated recomendaciones. StrictMode
  // (see main.tsx) mounts effects twice in dev, and unlike `finish-dataset.tsx`
  // this writer re-reads the workbook from disk on every call — a second
  // concurrent run would read the pre-write buffer and append/upsert against
  // stale data, producing real duplicate rows, not a harmless re-upsert.
  // `hasSubmitted` is mutated synchronously the first time, so the second
  // invocation (same tick, same closure) sees it and skips entirely —
  // mirrors `useDataExtraction.ts`'s `extractionStartedForRef` latch.
  //
  // `activeRef` is intentionally a single ref SHARED across both StrictMode
  // invocations rather than a `let active` captured per-closure: the
  // submission that actually runs is the one kicked off by the FIRST
  // invocation, but that invocation's own cleanup fires immediately
  // (StrictMode's mount→cleanup→mount dance) — a per-closure flag would be
  // flipped false before the submission resolves and the loading spinner
  // would hang forever. The shared ref is re-armed to `true` by the second
  // invocation's setup, so by the time the (still in-flight, first-started)
  // submission resolves, `activeRef.current` correctly reflects "still
  // mounted" rather than "the closure that started it was cleaned up".
  const hasSubmitted = useRef(false);
  const activeRef = useRef(true);

  // biome-ignore lint/correctness/useExhaustiveDependencies: submit the initial file snapshot once
  useEffect(() => {
    activeRef.current = true;

    if (hasSubmitted.current) {
      return () => {
        activeRef.current = false;
      };
    }
    hasSubmitted.current = true;

    const submitAll = async () => {
      for (const file of files) {
        if (!file.recomendacion) continue;

        try {
          await submitRecomendacion({
            values: file.recomendacion.values,
            documentId: file.recomendacion.documentId,
            fileName: file.data.name,
            validatedAt: localIsoDate(),
          });
        } catch {
          if (activeRef.current)
            setErrorNames((names) => [...names, file.data.name]);
        }
      }
    };

    void submitAll()
      .catch(() => undefined)
      .finally(() => {
        if (activeRef.current) setIsLoading(false);
      });

    return () => {
      activeRef.current = false;
    };
  }, []);

  return (
    <>
      <FinishMainContent feature={feature}>
        {files.map(({ data }) => (
          <FileCheck
            key={data.name}
            fileName={data.name}
            hasError={checkForErrors(data.name)}
            {...{ isLoading }}
          />
        ))}
      </FinishMainContent>
      <Footer withBuiltBy>
        <HStack alignItems="center" gap="4">
          <Button variant="secondary" onClick={onRestart} size="md">
            {t("finish.restart")}
          </Button>
          <Button size="md" onClick={filesystem.excel.open}>
            {t("finish.viewResult")}
          </Button>
        </HStack>
      </Footer>
    </>
  );
}
