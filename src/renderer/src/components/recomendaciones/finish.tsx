import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import FileCheck from "@/components/file-check";
import FinishMainContent from "@/components/finish/finish-main-content";
import Footer from "@/components/layout/footer";
import { useFiles } from "@/hooks";
import filesystem from "@/services/filesystem";
import { HStack } from "@/styled/jsx";
import { FeatureFlowEnum, featureNamespace } from "@/types/features";
import { submitRecomendacion } from "@/utils/recomendaciones/submit-recomendacion";
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

  // At first render, submit all the validated recomendaciones
  // biome-ignore lint/correctness/useExhaustiveDependencies: submit the initial file snapshot once
  useEffect(() => {
    let active = true;

    const submitAll = async () => {
      for (const file of files) {
        if (!file.recomendacion) continue;

        try {
          await submitRecomendacion({
            values: file.recomendacion.values,
            documentId: file.recomendacion.documentId,
            fileName: file.data.name,
            validatedAt: new Date().toISOString().slice(0, 10),
          });
        } catch {
          if (active) setErrorNames((names) => [...names, file.data.name]);
        }
      }
    };

    void submitAll()
      .catch(() => undefined)
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
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
