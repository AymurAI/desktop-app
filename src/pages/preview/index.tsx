import { ChangeEventHandler, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Text,
  Button,
  Card,
  Subtitle,
  FilePreview,
  Grid,
  HiddenInput,
  PreviousButton,
} from 'components';
import { useFiles, useStepper } from 'hooks';
import { Footer, Section } from 'layout/main';

export default function Preview() {
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { previousStep, nextStep } = useStepper();
  const { removeAllFiles, files, addFiles, filterUnselected } = useFiles();

  const handlePrevious = () => {
    removeAllFiles();
    previousStep();
    navigate('/onboarding');
  };

  const handleSelectFile = () => {
    inputRef.current?.click();
  };

  const handleAddedFiles: ChangeEventHandler<HTMLInputElement> = (e) => {
    const rawFiles = e.target.files;

    // Check if any file was added
    if (rawFiles) addFiles(Array.from(rawFiles));
  };

  const handleConfirmFiles = () => {
    filterUnselected();
    nextStep();
    navigate('/process');
  };

  return (
    <>
      {/* MAIN SECTION */}
      <Section spacing="xl">
        <PreviousButton onClick={handlePrevious}>
          1. Previsualización de archivos
        </PreviousButton>
        <Card>
          <Subtitle>Archivos seleccionados</Subtitle>
          <Grid
            columns={5}
            spacing="xl"
            justify="center"
            css={{ width: '100%' }}
          >
            {files.map((file) => (
              <FilePreview key={file.data.name} file={file}></FilePreview>
            ))}
          </Grid>
        </Card>
      </Section>

      {/* FOOTER */}
      <Footer>
        <HiddenInput
          type="file"
          accept=".doc,.docx"
          ref={inputRef}
          onChange={handleAddedFiles}
          multiple
          tabIndex={-1}
        />
        <Text size="sm">Formatos válidos: .doc y .docx</Text>
        <Button onClick={handleSelectFile} variant="secondary">
          Cargar más documentos
        </Button>
        <Button onClick={handleConfirmFiles}>Continuar</Button>
      </Footer>
    </>
  );
}
