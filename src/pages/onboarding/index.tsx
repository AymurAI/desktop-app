import { ChangeEventHandler, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button, HiddenInput, Stack, Text, Title, Arrow } from 'components';
import { Section, Footer } from 'layout/main';
import { useStepper, useFileDispatch } from 'hooks';
import { Card } from './cards';
import { addFiles } from 'reducers/file/actions';

export default function Onboarding() {
  const inputRef = useRef<HTMLInputElement>(null);
  const dispatch = useFileDispatch();
  const { nextStep } = useStepper();
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
      nextStep();
      navigate('/preview');
    }
  };

  return (
    <>
      {/* Onboarding description */}
      <Section spacing="xl">
        <Stack spacing="m">
          <Title weight="strong">¿Cómo funciona AymurAI?</Title>
          <Text>
            Esta herramienta te permitirá subir las resoluciones del juzgado
            para que sean analizadas por una inteligencia artificial que
            extraerá la información relevante para el set de datos abiertos con
            perspectiva de género.
          </Text>
        </Stack>
        <Stack align="stretch" spacing="m" css={{ alignSelf: 'center' }}>
          <Card step={1} text="Selecciona los archivos" />
          <Arrow.Right />
          <Card
            step={2}
            text="La inteligencia artificial procesará los archivos"
          />
          <Arrow.Right />
          <Card
            step={3}
            text="Valida que la información identificada sea correcta"
          />
          <Arrow.Right />
          <Card
            step={4}
            text="Proceso terminado. Los archivos ya son parte del set de datos."
          />
        </Stack>
      </Section>

      {/* Input file */}
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
        <Button onClick={handleSelectFile}>Cargar documentos</Button>
      </Footer>
    </>
  );
}
