import { type ChangeEventHandler, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { Button, HiddenInput, Stack, Text, Title } from "@/components";
import { useFileDispatch } from "@/hooks";
import { Footer, Section } from "@/layout/main";
import { addFiles } from "@/reducers/file/actions";

import FeatureRouter from "@/features/FeatureRouter";
import { Card } from "./Cards";
import { Grid } from "./grid";

interface GenericDatasetProps {
  description: string;
  actionText: string;
  steps: [string, string, string, string];
  supportMultipleFiles: boolean;
}
function GenericDataset({
  description,
  steps,
  supportMultipleFiles,
  actionText,
}: GenericDatasetProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dispatch = useFileDispatch();
  const navigate = useNavigate();

  const handleSelectFile = () => {
    inputRef.current?.click();
  };

  const handleAddedFiles: ChangeEventHandler<HTMLInputElement> = (e) => {
    const rawFiles = e.target.files;

    // Check if any file was added
    if (rawFiles) {
      const files = Array.from(rawFiles);

      dispatch(addFiles(files));
      navigate("../preview");
    }
  };

  return (
    <>
      {/* Onboarding description */}
      <Section spacing="xl">
        <Stack spacing="m">
          <Title weight="strong">¿Cómo funciona AymurAI?</Title>
          <Text>{description}</Text>
        </Stack>
        <Grid>
          {steps.map((step, index) => (
            <Card key={step} step={index + 1} text={step} />
          ))}
        </Grid>
      </Section>

      {/* Input file */}
      <Footer>
        <HiddenInput
          type="file"
          accept=".docx, .pdf"
          ref={inputRef}
          onChange={handleAddedFiles}
          multiple={supportMultipleFiles}
          tabIndex={-1}
        />
        <Text size="s">Formatos válidos: .docx, .pdf</Text>
        <Button onClick={handleSelectFile} size="l">
          {actionText}
        </Button>
      </Footer>
    </>
  );
}

export default function Onboarding() {
  return (
    <FeatureRouter
      DATA_SET={
        <GenericDataset
          description="Esta herramienta te permitirá subir las resoluciones del juzgado para que sean analizadas por una inteligencia artificial que extraerá la información relevante para el set de datos abiertos con perspectiva de género."
          actionText="Selecciona los archivos"
          steps={[
            "Selecciona los archivos",
            "La inteligencia artificial procesará los archivos",
            "Valida que la información identificada sea correcta",
            "Proceso terminado. Los archivos ya son parte del set de datos.",
          ]}
          supportMultipleFiles={true}
        />
      }
      ANONYMIZER={
        <GenericDataset
          description="Esta herramienta te permitirá subir las resoluciones del juzgado para que sean analizadas por una inteligencia artificial que anonimizará los datos sensibles de las personas involucradas y de los hechos del caso."
          actionText="Selecciona el archivo"
          steps={[
            "Selecciona el archivo",
            "La inteligencia artificial procesará el archivo",
            "Valida que la información a anonimizar sea correcta",
            "Proceso terminado. El documento esta listo para ser exportado.",
          ]}
          supportMultipleFiles={true}
        />
      }
      VOICE_TO_TEXT={null}
    />
  );
}
