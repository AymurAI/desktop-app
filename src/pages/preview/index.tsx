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
  SectionTitle,
} from 'components';
import { useFileDispatch, useFiles, useStepper } from 'hooks';
import { Footer, Section } from 'layout/main';
import {
  addFiles,
  filterUnselected,
  removeAllFiles,
} from 'reducers/file/actions';

export default function Preview() {
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { previousStep, nextStep } = useStepper();
  const files = useFiles();
  const dispatch = useFileDispatch();

  const handlePrevious = () => {
    dispatch(removeAllFiles());
    previousStep();
    navigate('/onboarding');
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
    nextStep();
    navigate('/process');
  };

  return (
    <>
      {/* MAIN SECTION */}
      <Section spacing="xl">
        <SectionTitle onClick={handlePrevious}>
          1. Previsualización de archivos
        </SectionTitle>
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
