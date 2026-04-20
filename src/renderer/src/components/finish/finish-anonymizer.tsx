import { useFiles } from "@/hooks";
import { aymuraiService } from "@/services/aymurai";
import { HStack } from "@/styled/jsx";
import { FeatureFlowEnum } from "@/types/features";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import FileCheck from "../file-check";
import Footer from "../layout/footer";
import Button from "../ui/button";
import FinishMainContent from "./finish-main-content";

interface FinishAnonymizerProps {
  onRestart: () => void;
}
export default function FinishAnonymizer({ onRestart }: FinishAnonymizerProps) {
  const { t } = useTranslation("anonymizer");
  const file = useFiles().at(0);

  if (!file) throw new Error("Reached /finish but there's no file to read");

  const {
    data: fileURI,
    isLoading,
    isError,
  } = useQuery(aymuraiService.anonymize(file));

  const downloadDocument = async () => {
    if (!fileURI) {
      console.error("Tried to download a file that is not ready.");
      return;
    }
    const link = document.createElement("a");
    link.href = fileURI;
    link.download = changeExtension(file.data.name);

    link.click();

    document.removeChild(link);
  };

  return (
    <>
      <FinishMainContent feature={FeatureFlowEnum.Anonymizer}>
        <FileCheck
          fileName={file.data.name}
          hasError={isError}
          isLoading={isLoading}
        />
      </FinishMainContent>
      <Footer withBuiltBy>
        <HStack alignItems="center" gap="4">
          <Button variant="secondary" onClick={onRestart}>
            {t("finish.restart")}
          </Button>
          <Button onClick={downloadDocument} disabled={isError}>
            {t("finish.viewResult")}
          </Button>
        </HStack>
      </Footer>
    </>
  );
}

function changeExtension(name: string) {
  const parts = name.split(".");
  parts.pop();
  return `${[...parts].join(".")}_anonimizado.odt`;
}
