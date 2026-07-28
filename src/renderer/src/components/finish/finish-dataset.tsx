import { useFiles } from "@/hooks/useFiles";
import filesystem from "@/services/filesystem";
import { HStack } from "@/styled/jsx";
import { FeatureFlowEnum } from "@/types/features";
import { submitValidations } from "@/utils/file";
import { Button } from "@aymurai/ui";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import FileCheck from "../file-check";
import Footer from "../layout/footer";
import FinishMainContent from "./finish-main-content";

interface FinishDatasetProps {
  onRestart: () => void;
}
export default function FinishDataset({ onRestart }: FinishDatasetProps) {
  const { t } = useTranslation("dataset");
  const files = useFiles();

  const [errorNames, setErrorNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const checkForErrors = (fileName: string) =>
    !!errorNames.find((name) => name === fileName);

  // At first render, submit all the data
  // biome-ignore lint/correctness/useExhaustiveDependencies: submit the initial file snapshot once
  useEffect(() => {
    let active = true;

    const submitAll = async () => {
      for (const file of files) {
        try {
          await submitValidations({
            isOnline: false,
            validations: file.validationObject,
          });
        } catch {
          if (active) setErrorNames((names) => [...names, file.data.name]);
        }
      }

      // Feedback export is secondary to saving each validated document.
      await filesystem.feedback.export(files).catch(() => undefined);
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
      <FinishMainContent feature={FeatureFlowEnum.Dataset}>
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
