import { Button, Stack, Text, Title } from 'components';
import { Section, Footer } from 'layout/main';

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
      </Section>

      {/* Input file */}
      <Footer>
        <Text size="sm">Formatos válidos: .doc y .docx</Text>
        <Button onClick={handleSelectFile}>Cargar documentos</Button>
      </Footer>
    </>
  );
}
