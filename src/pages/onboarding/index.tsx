import { ChangeEventHandler, useRef } from 'react';

import { Button, Stack, Text, Title } from 'components';
import { Section, Footer } from 'layout/main';

import { Card } from './cards';
import { Input } from './Input';
import { Arrow } from 'components';

export default function Onboarding() {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelectFile = () => {
    inputRef.current?.click();
  };

  const handleAddFile: ChangeEventHandler<HTMLInputElement> = (e) => {
    logger.info('Test', e.target.files);
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
        <Input
          type="file"
          accept=".doc,.docx"
          ref={inputRef}
          onChange={handleAddFile}
          multiple
        />
        <Text size="sm">Formatos válidos: .doc y .docx</Text>
        <Button onClick={handleSelectFile}>Cargar documentos</Button>
      </Footer>
    </>
  );
}
