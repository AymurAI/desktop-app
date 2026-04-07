import {
  Button,
  Card,
  FileCheck,
  Grid,
  SectionTitle,
  Subtitle,
  Text,
} from "@/components";
import { useFileDispatch, useFiles } from "@/hooks";

import { removeAllFiles } from "@/reducers/file/actions";
import { aymuraiService } from "@/services/aymurai";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import Footer from "../layout/footer";
import MainContent from "../layout/main-content";

const changeExtension = (name: string) => {
  const parts = name.split(".");
  parts.pop();
  return `${[...parts].join(".")}_anonimizado.odt`;
};

export function FinishAnonymizer() {
  const { t } = useTranslation("anonymizer");
  const params = useParams({ from: "/app/$feature/finish" });
  // We are sure that there is only one file, because we came from
  // anonimization workflow
  const file = useFiles()[0];
  const dispatch = useFileDispatch();
  const navigate = useNavigate();

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

  const handleRestart = () => {
    dispatch(removeAllFiles());
    navigate({ to: "/app/$feature/onboarding", params });
  };

  return (
    <>
      <MainContent>
        <SectionTitle>{t("finish.sectionTitle")}</SectionTitle>
        <Text css={{ maxWidth: "60%" }}>{t("finish.description")}</Text>
        <Card>
          <Subtitle>{t("finish.subtitle")}</Subtitle>
          <Grid
            columns={4}
            spacing="xl"
            justify="center"
            css={{ width: "100%" }}
          >
            <FileCheck
              fileName={file.data.name}
              hasError={isError}
              isLoading={isLoading}
            />
          </Grid>
        </Card>
      </MainContent>
      <Footer>
        <Button variant="secondary" onClick={handleRestart}>
          {t("finish.restart")}
        </Button>
        <Button onClick={downloadDocument} disabled={isError}>
          {t("finish.download")}
        </Button>
      </Footer>
    </>
  );
}
