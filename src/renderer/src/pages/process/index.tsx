import { Bell } from "phosphor-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Button,
  Card,
  FileProcessing,
  SectionTitle,
  Stack,
  Subtitle,
  Text,
  Toast,
} from "@/components";
import { useFileDispatch, useFiles } from "@/hooks";
import type { PredictStatus } from "@/hooks/usePredict";
import { Footer, Section } from "@/layout/main";
import {
  filterUnprocessed,
  removeAllPredictions,
} from "@/reducers/file/actions";

import FeatureRouter from "@/features/FeatureRouter";
import useNotify from "./useNotify";
import { canContinue, initProcessState, replace } from "./utils";

interface GenericProcessProps {
  title: string;
  supportMultipleFiles: boolean;
}
function GenericProcess({ title, supportMultipleFiles }: GenericProcessProps) {
  const navigate = useNavigate();
  const dispatch = useFileDispatch();
  const files = useFiles();
  const [process, setProcess] = useState(initProcessState(files));
  const { isToastVisible, hideToast } = useNotify(process);

  const handleStatusChange = (name: string) => (newValue: PredictStatus) => {
    // Replace the newValue
    setProcess((cur) => replace(name, { status: newValue }, cur));
  };
  const handleReplaceFile = (name: string) => (newName: string) => {
    setProcess((cur) =>
      replace(name, { name: newName, status: "processing" }, cur),
    );
  };

  const handlePrevious = () => {
    navigate("/preview");
    dispatch(removeAllPredictions());
  };

  const handleNext = () => {
    dispatch(filterUnprocessed());
    navigate("../validation");
  };

  return (
    <>
      <Section>
        <Toast isVisible={isToastVisible} onClose={hideToast} icon={<Bell />}>
          {supportMultipleFiles
            ? "Se finalizó el análisis de tus documentos."
            : "Se finalizó el análisis del documento."}
        </Toast>
        <SectionTitle onClick={handlePrevious}>{title}</SectionTitle>
        <Card css={{ alignItems: "stretch" }}>
          <Stack spacing="l" direction="column">
            <Stack direction="column" spacing="xs">
              {supportMultipleFiles ? (
                <Text>AymurAI está extrayendo los datos de los archivos</Text>
              ) : (
                <Text>AymurAI está extrayendo los datos del archivo</Text>
              )}
              <Subtitle size="s">
                Este proceso puede tardar algunos minutos.
              </Subtitle>
            </Stack>
            {files.map((f) => (
              <FileProcessing
                key={f.data.name}
                file={f}
                onStatusChange={handleStatusChange(f.data.name)}
                onFileReplace={handleReplaceFile(f.data.name)}
              />
            ))}
          </Stack>
        </Card>
      </Section>
      <Footer>
        <Button size="l" disabled={!canContinue(process)} onClick={handleNext}>
          Siguiente
        </Button>
      </Footer>
    </>
  );
}

export default function Process() {
  return (
    <FeatureRouter
      DATA_SET={
        <GenericProcess
          title="2. Procesamiento de los archivos"
          supportMultipleFiles={true}
        />
      }
      ANONYMIZER={
        <GenericProcess
          title="2. Procesamiento del archivo"
          supportMultipleFiles={false}
        />
      }
    />
  );
}
