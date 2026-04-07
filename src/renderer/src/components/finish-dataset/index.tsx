import { useEffect, useState } from "react";

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
import { Footer, Section } from "@/layout/main-old";
import { removeAllFiles } from "@/reducers/file/actions";
import filesystem from "@/services/filesystem";
import type { DocFile } from "@/types/file";
import { submitValidations } from "@/utils/file";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import * as S from "./FinishDataset.styles";

export function FinishDataset() {
  const { t } = useTranslation("dataset");
  const params = useParams({ from: "/app/$feature/finish" });
  const files = useFiles();
  const dispatch = useFileDispatch();
  const navigate = useNavigate();
  const [errorNames, setErrorNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleRestart = () => {
    dispatch(removeAllFiles());
    navigate({ to: "/app/$feature/onboarding", params });
  };

  const checkForErrors = (fileName: string) =>
    !!errorNames.find((name) => name === fileName);

  const submit = async (file: DocFile) => {
    try {
      // POST the validated data to the dataset
      await submitValidations({
        isOnline: false,
        validations: file.validationObject,
      });
    } catch {
      setErrorNames((names) => [...names, file.data.name]);
    }

    // Export the feedback JSON
    await filesystem.feedback.export(files);
  };

  // At first render, submit all the data
  useEffect(() => {
    const submitAll = async () => {
      for (const file of files) {
        await submit(file);
      }
    };

    submitAll().then(() => setIsLoading(false));

    // We strictly need to run this effect once
  }, []);

  return (
    <>
      <Section>
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
            {files.map(({ data }) => (
              <FileCheck
                key={data.name}
                fileName={data.name}
                hasError={checkForErrors(data.name)}
                {...{ isLoading }}
              />
            ))}
          </Grid>
        </Card>
      </Section>
      <Footer>
        <S.Anchor
          href="https://www.datagenero.org/"
          target="_blank"
          rel="noreferrer"
        >
          <img src="/brand/data-genero.png" alt="DataGenero" width={150} />
        </S.Anchor>

        <Button variant="secondary" onClick={handleRestart} size="md">
          {t("finish.restart")}
        </Button>
        <Button size="md" onClick={filesystem.excel.open}>
          {t("finish.viewDataset")}
        </Button>
      </Footer>
    </>
  );
}
