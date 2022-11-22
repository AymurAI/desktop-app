import { Button, Stack, Text, Title } from 'components';
import { Section, Footer } from 'layout/main';

import { CardContainer, Card } from './cards';
import { Input } from './Input';
import RightArrow from './RightArrow';

export default function Onboarding() {

  return (
    <>
      {/* Onboarding description */}
      <Section css={{ gap: '$xl' }}>
        <Stack spacing="m">
          <Title weight="strong">¿Cómo funciona AymurAI?</Title>
          <Text>
            Esta herramienta te permitirá subir las resoluciones del juzgado
            para que sean analizadas por una inteligencia artificial que
            extraerá la información relevante para el set de datos abiertos con
            perspectiva de género.
          </Text>
        </Stack>
        <CardContainer>
          <Card step={1} text="Selecciona los archivos" />
          <RightArrow />
          <Card
            step={2}
            text="La inteligencia artificial procesará los archivos"
          />
          <RightArrow />
          <Card
            step={3}
            text="Valida que la información identificada sea correcta"
          />
          <RightArrow />
          <Card
            step={4}
            text="Proceso terminado. Los archivos ya son parte del set de datos."
          />
        </CardContainer>
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
