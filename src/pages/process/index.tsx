import { useNavigate } from 'react-router-dom';

import { useStepper, useFiles, useFileDispatch } from 'hooks';
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
import { isPredictionCompleted } from 'utils/file';

export default withFileProtection(function Process() {
  const navigate = useNavigate();
  const { previousStep, nextStep } = useStepper();
  const dispatch = useFileDispatch();
  const files = useFiles();

  const handlePrevious = () => {
    previousStep();
    navigate('/preview');
    dispatch(removeAllPredictions());
  };

  const handleNext = () => {
    nextStep();
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
              <FileProcessing key={data.name} file={data} />
            ))}
          </Stack>
        </Card>
      </Section>
      <Footer>
        <Button
          size="l"
          disabled={!isPredictionCompleted(files)}
          onClick={handleNext}
        >
          Siguiente
        </Button>
      </Footer>
    </>
  );
});
