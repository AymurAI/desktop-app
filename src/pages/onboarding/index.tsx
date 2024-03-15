import { ChangeEventHandler, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button, HiddenInput, Stack, Text, Title } from 'components';
import { Section, Footer } from 'layout/main';
import { useFileDispatch, useUser } from 'hooks';
import { Card } from './cards';
import { addFiles } from 'reducers/file/actions';
import { FunctionType } from 'types/user';
import { Grid } from './grid';

export default function Onboarding() {
  const user = useUser();
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
            {user?.function === FunctionType.DATASET && (
              <>
                Esta herramienta te permitirá subir las resoluciones del juzgado
                para que sean analizadas por una inteligencia artificial que
                extraerá la información relevante para el set de datos abiertos
                con perspectiva de género.
              </>
            )}
            {user?.function === FunctionType.ANONYMIZER && (
              <>
                Esta herramienta te permitirá subir las resoluciones del juzgado
                para que sean analizadas por una inteligencia artificial que
                anonimizará los datos sensibles de las personas involucradas y
                de los hechos del caso.
              </>
            )}
          </Text>
        </Stack>
        <Grid>
          <Card
            step={1}
            text={
              user?.function === FunctionType.ANONYMIZER
                ? 'Selecciona el archivo'
                : 'Selecciona los archivos'
            }
          />
          <Card
            step={2}
            text={
              user?.function === FunctionType.ANONYMIZER
                ? 'La inteligencia artificial procesará el archivo'
                : 'La inteligencia artificial procesará los archivos'
            }
          />
          <Card
            step={3}
            text={
              user?.function === FunctionType.ANONYMIZER
                ? 'Valida que la información a anonimizar sea correcta'
                : 'Valida que la información identificada sea correcta'
            }
          />
          <Card
            step={4}
            text={
              user?.function === FunctionType.ANONYMIZER
                ? 'Proceso terminado. El documento esta listo para ser exportado.'
                : 'Proceso terminado. Los archivos ya son parte del set de datos.'
            }
          />
        </Grid>
      </Section>

      {/* Input file */}
      <Footer>
        <HiddenInput
          type="file"
          accept=".doc,.docx"
          ref={inputRef}
          onChange={handleAddedFiles}
          multiple={user?.function === FunctionType.DATASET ? true : false}
          tabIndex={-1}
        />
        <Text size="s">Formatos válidos: .doc y .docx</Text>
        <Button onClick={handleSelectFile} size="l">
          {user?.function === FunctionType.ANONYMIZER
            ? 'Carga el documento'
            : 'Cargar documentos'}
        </Button>
      </Footer>
    </>
  );
}
