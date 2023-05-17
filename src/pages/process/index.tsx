import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Bell } from 'phosphor-react';

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
  Toast,
} from 'components';
import withFileProtection from 'features/withFileProtection';
import { filterUnprocessed, removeAllPredictions } from 'reducers/file/actions';
import { initProcessState, canContinue, replace } from './utils';
import { PredictStatus } from 'hooks/usePredict';
import taskbar from 'services/taskbar';

export default withFileProtection(function Process() {
  const navigate = useNavigate();
  const dispatch = useFileDispatch();
  const files = useFiles();
  const [process, setProcess] = useState(initProcessState(files));
  const [isToastVisible, setIsToastVisible] = useState(false);

  const handleStatusChange = (name: string) => (newValue: PredictStatus) => {
    // Replace the newValue
    setProcess((cur) => replace(name, { status: newValue }, cur));
  };
  const handleReplaceFile = (name: string) => (newName: string) => {
    setProcess((cur) =>
      replace(name, { name: newName, status: 'processing' }, cur)
    );
  };

  const hideToast = () => setIsToastVisible(false);

  const handlePrevious = () => {
    navigate('/preview');
    dispatch(removeAllPredictions());
  };

  const handleNext = () => {
    dispatch(filterUnprocessed());
    navigate('/validation');
  };

  // Not ideal to use an useEffect to change an state, but doing it ina proper way
  // requires refactor to change state based on process state
  useEffect(() => {
    if (canContinue(process) && !isToastVisible) {
      taskbar.notify();
      setIsToastVisible(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canContinue(process)]);

  return (
    <>
      <Section>
        <Toast isVisible={isToastVisible} onClose={hideToast} icon={<Bell />}>
          Se finalizo la carga de tus documentos.
        </Toast>
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
                onStatusChange={handleStatusChange(data.name)}
                onFileReplace={handleReplaceFile(data.name)}
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
