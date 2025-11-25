import { type ChangeEventHandler, useRef } from "react";
import { useNavigate } from "react-router-dom";

import {
  Button,
  Card,
  FilePreview,
  Grid,
  HiddenInput,
  SectionTitle,
  Subtitle,
  Text,
} from "@/components";
import FeatureRouter from "@/features/FeatureRouter";
import { useFileDispatch, useFiles } from "@/hooks";
import { Footer, Section } from "@/layout/main";
import {
  addFiles,
  filterUnselected,
  removeAllFiles,
} from "@/reducers/file/actions";

interface GenericPreviewProps {
  title: string;
  supportMultipleFiles: boolean;
}
function GenericPreview({ title, supportMultipleFiles }: GenericPreviewProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const files = useFiles();
  const dispatch = useFileDispatch();

  const isAnyFileSelected = files.some((file) => file.selected);

  const handlePrevious = () => {
    dispatch(removeAllFiles());
    navigate("../onboarding");
  };

  const handleSelectFile = () => {
    inputRef.current?.click();
  };

  const handleAddedFiles: ChangeEventHandler<HTMLInputElement> = (e) => {
    const rawFiles = e.target.files;

    // Check if any file was added
    if (rawFiles) {
      const fileArray = Array.from(rawFiles);

      dispatch(addFiles(fileArray));
    }
  };

  const handleConfirmFiles = () => {
    dispatch(filterUnselected());
    navigate("../process");
  };

  return (
    <>
      {/* MAIN SECTION */}
      <Section spacing="xl">
        <SectionTitle onClick={handlePrevious}>{title}</SectionTitle>
        <Card>
          {supportMultipleFiles && <Subtitle>Archivos seleccionados</Subtitle>}
          <Grid
            columns={supportMultipleFiles ? 5 : 1}
            spacing="xl"
            justify="center"
            css={{ width: "100%" }}
          >
            {files.map((file) => (
              <FilePreview key={file.data.name} file={file} />
            ))}
          </Grid>
        </Card>
      </Section>

      {/* FOOTER */}
      <Footer>
        <HiddenInput
          type="file"
          accept=".docx"
          ref={inputRef}
          onChange={handleAddedFiles}
          multiple
          tabIndex={-1}
        />
        {supportMultipleFiles && (
          <>
            <Text size="s">Formatos válidos: .docx, .pdf</Text>
            <Button onClick={handleSelectFile} size="l" variant="secondary">
              Cargar más documentos
            </Button>
          </>
        )}
        <Button
          onClick={handleConfirmFiles}
          disabled={
            !isAnyFileSelected || files.some((f) => !f.paragraphs?.length)
          }
          size="l"
        >
          Continuar
        </Button>
      </Footer>
    </>
  );
}

export default function Preview() {
  return (
    <FeatureRouter
      DATA_SET={
        <GenericPreview
          supportMultipleFiles={true}
          title="1. Previsualización de archivos"
        />
      }
      ANONYMIZER={
        <GenericPreview
          supportMultipleFiles={false}
          title="1. Previsualización del archivo"
        />
      }
    />
  );
}
