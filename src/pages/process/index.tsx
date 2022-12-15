import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

import { useFiles, useFileDispatch } from 'hooks';
import { Footer, Section } from 'layout/main';
import {
  SectionTitle,
  Button,
  Card,
  Stack,
  Text,
  Subtitle,
  FileProcessing,
} from 'components';
import withFileProtection from 'features/withFileProtection';
import { removeAllPredictions } from 'reducers/file/actions';
import {
  initProcessState,
  isPredictionCompleted as checkPrediction,
  replaceValue,
} from './utils';
import { PredictStatus } from 'hooks/usePredict';

export default withFileProtection(function Process() {
  const navigate = useNavigate();
  const dispatch = useFileDispatch();
  const files = useFiles();
  const [process, setProcess] = useState(initProcessState(files));

  const isPredictionCompleted = checkPrediction(process);

  const handleStatusChange = (name: string) => (newValue: PredictStatus) => {
    // Replace the newValue
    const arr = replaceValue(name, newValue, process);

    setProcess(arr);
  };

  const handlePrevious = () => {
    navigate('/preview');
    dispatch(removeAllPredictions());
  };

  const handleNext = () => {
    navigate('/validation');
  };

  return (
    <>
      <Section>
        <SectionTitle onClick={handlePrevious}>
          2. Procesamiento de los archivos
        </SectionTitle>
        <Card css={{ alignItems: 'stretch' }}>
          <Stack spacing="l" direction="column">
            <Stack direction="column" spacing="xs">
              <Text>AymurAI está extrayendo los datos de los archivos</Text>
              <Subtitle size="s">
                Este proceso puede tardar algunos minutos.
              </Subtitle>
            </Stack>
            {files.map(({ data }) => (
              <FileProcessing
                key={data.name}
                file={data}
                onStatusChange={handleStatusChange}
              />
            ))}
          </Stack>
        </Card>
      </Section>
      <Footer>
        <Button size="l" disabled={!isPredictionCompleted} onClick={handleNext}>
          Siguiente
        </Button>
      </Footer>
    </>
  );
});
