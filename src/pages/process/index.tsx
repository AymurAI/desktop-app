import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Bell } from 'phosphor-react';

import { useFiles, useFileDispatch, useUser } from 'hooks';
import { Footer, Section } from 'layout/main';
import {
  SectionTitle,
  Button,
  Card,
  Stack,
  Text,
  Subtitle,
  FileProcessing,
  Toast,
} from 'components';
import withFileProtection from 'features/withFileProtection';
import { filterUnprocessed, removeAllPredictions } from 'reducers/file/actions';
import { initProcessState, canContinue, replace } from './utils';
import { PredictStatus } from 'hooks/usePredict';
import useNotify from './useNotify';

import { FunctionType } from 'types/user';

export default withFileProtection(function Process() {
  const user = useUser();
  const navigate = useNavigate();
  const dispatch = useFileDispatch();
  const files = useFiles();
  const [process, setProcess] = useState(initProcessState(files));
  const { isToastVisible, hideToast } = useNotify(process);

  const handleStatusChange = (name: string) => (newValue: PredictStatus) => {
    // Replace the newValue
    setProcess((cur) => replace(name, { status: newValue }, cur));
  };
  const handleReplaceFile = (name: string) => (newName: string) => {
    setProcess((cur) =>
      replace(name, { name: newName, status: 'processing' }, cur)
    );
  };

  const handlePrevious = () => {
    navigate('/preview');
    dispatch(removeAllPredictions());
  };

  const handleNext = () => {
    dispatch(filterUnprocessed());

    if (user?.function === FunctionType.DATASET) {
      navigate('/validation/dataset');
    } else {
      navigate('/validation/anonymizer');
    }
  };

  return (
    <>
      <Section>
        <Toast isVisible={isToastVisible} onClose={hideToast} icon={<Bell />}>
          {user?.function === FunctionType.DATASET
            ? 'Se finalizó el análisis de tus documentos.'
            : 'Se finalizó el análisis del documento.'}
        </Toast>
        <SectionTitle onClick={handlePrevious}>
          {user?.function === FunctionType.DATASET
            ? '2. Procesamiento de los archivos'
            : '2. Procesamiento del documento'}
        </SectionTitle>
        <Card css={{ alignItems: 'stretch' }}>
          <Stack spacing="l" direction="column">
            <Stack direction="column" spacing="xs">
              {user?.function === FunctionType.DATASET ? (
                <Text>AymurAI está extrayendo los datos de los archivos</Text>
              ) : (
                <Text>AymurAI está extrayendo los datos del archivo</Text>
              )}
              <Subtitle size="s">
                Este proceso puede tardar algunos minutos.
              </Subtitle>
            </Stack>
            {files.map((f) => (
              <FileProcessing
                key={f.data.name}
                file={f}
                onStatusChange={handleStatusChange(f.data.name)}
                onFileReplace={handleReplaceFile(f.data.name)}
              />
            ))}
          </Stack>
        </Card>
      </Section>
      <Footer>
        <Button size="l" disabled={!canContinue(process)} onClick={handleNext}>
          Siguiente
        </Button>
      </Footer>
    </>
  );
});
