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
} from "components";
import { useFileDispatch, useFiles, useUser } from "hooks";
import { Footer, Section } from "layout/main";
import {
  addFiles,
  filterUnselected,
  removeAllFiles,
} from "reducers/file/actions";

import { FunctionType } from "types/user";

export default function Preview() {
  const user = useUser();
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const files = useFiles();
  const dispatch = useFileDispatch();

  const isAnyFileSelected = files.some((file) => file.selected);

  const handlePrevious = () => {
    dispatch(removeAllFiles());
    navigate("/onboarding");
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
    navigate("/process");
  };

  return (
    <>
      {/* MAIN SECTION */}
      <Section spacing="xl">
        <SectionTitle onClick={handlePrevious}>
          {user?.function === FunctionType.ANONYMIZER
            ? " 1. Previsualización del archivo"
            : " 1. Previsualización de archivos"}
        </SectionTitle>
        <Card>
          {user?.function === FunctionType.DATASET && (
            <Subtitle>Archivos seleccionados</Subtitle>
          )}
          <Grid
            columns={user?.function === FunctionType.ANONYMIZER ? 1 : 5}
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
        {user?.function === FunctionType.DATASET && (
          <>
            <Text size="s">Formatos válidos: .docx</Text>
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
