import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Card,
  FileCheck,
  Grid,
  SectionTitle,
  Subtitle,
  Text,
  Button,
} from "components";
import { useFileDispatch, useFiles, useUser } from "hooks";
import { Footer, Section } from "layout/main";
import { removeAllFiles } from "reducers/file/actions";
import { DATASET_URL } from "utils/config";
import filesystem from "services/filesystem";
import { submitValidations } from "utils/file";
import { DocFile } from "types/file";
import Anchor from "./Anchor";
import Callout from "./Callout";
import { FunctionType } from "types/user";
import useAnonymizer from "hooks/useAnonymized";
import convertDocxToOdt from "services/aymurai/docx-to-odt";
import { saveAs } from "file-saver";

export default function Finish() {
  const files = useFiles();
  const dispatch = useFileDispatch();
  const navigate = useNavigate();
  const user = useUser();
  const [errorNames, setErrorNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleRestart = () => {
    dispatch(removeAllFiles());
    navigate("/onboarding");
  };
  const anonymizedText = useAnonymizer();
  const checkForErrors = (fileName: string) =>
    !!errorNames.find((name) => name === fileName);

  const submit = async (file: DocFile) => {
    try {
      // POST the validated data to the dataset
      await submitValidations({
        isOnline: user!.online,
        token: user!.token,
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
    if (user) {
      Promise.all(
        files.map(async (f) => {
          await submit(f);
        })
      ).then(() => setIsLoading(false));
    }

    // We strictly need to run this effect once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const downloadDocument = async () => {
    var header =
      "<html xmlns:o='urn:schemas-microsoft-com:office:office' " +
      "xmlns:w='urn:schemas-microsoft-com:office:word' " +
      "xmlns='http://www.w3.org/TR/REC-html40'>" +
      "<head><meta charset='utf-8'></head><body>";
    var footer = "</body></html>";
    var sourceHTML = header + anonymizedText + footer;

    var docBlob = new Blob(["\ufeff", sourceHTML], {
      type: "application/msword",
    });

    const docFile = new File([docBlob], "document.doc");
    const odtFile = await convertDocxToOdt(docFile);
    var odtBlob = new Blob([odtFile.data]);

    saveAs(odtBlob, files[0].data.name.split(".")[0] + ".odt");
  };

  return (
    <>
      <Section>
        <SectionTitle>4. Finalización</SectionTitle>
        <Text css={{ maxWidth: "60%" }}>
          {user?.function === FunctionType.ANONYMIZER
            ? "Los datos encontrados por AymurAI y posteriormente validados ya han sido anonimizados correctamente."
            : "Los datos encontrados por AymurAI y posteriormente validados ya son parte del set de datos abiertos con perspectiva de género."}
        </Text>

        <Card>
          <Subtitle>
            {user?.function === FunctionType.ANONYMIZER
              ? "Archivo procesado"
              : "Archivos procesados"}
          </Subtitle>
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
              ></FileCheck>
            ))}
          </Grid>
          {user?.function !== FunctionType.ANONYMIZER && <Callout />}
        </Card>
      </Section>
      <Footer>
        <Anchor
          href="https://www.datagenero.org/"
          target="_blank"
          rel="noreferrer"
        >
          <img src="brand/data-genero.png" alt="DataGenero" width={127} />
        </Anchor>
        {user?.online ? (
          <Button
            css={{ textDecoration: "none" }}
            variant="secondary"
            as="a"
            href={DATASET_URL}
            target="_blank"
            rel="noreferrer"
            size="l"
          >
            Ver set de datos
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="l"
            onClick={() =>
              user?.function === FunctionType.ANONYMIZER
                ? downloadDocument()
                : filesystem.excel.open()
            }
          >
            {user?.function === FunctionType.ANONYMIZER
              ? "Descargar documento"
              : "Ver set de datos"}
          </Button>
        )}

        <Button onClick={handleRestart} size="l">
          {user?.function === FunctionType.ANONYMIZER
            ? "Cargar un nuevo documento"
            : "Cargaar más documentos"}
        </Button>
      </Footer>
    </>
  );
}
