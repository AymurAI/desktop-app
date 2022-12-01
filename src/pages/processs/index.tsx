import { useNavigate } from 'react-router-dom';

import { useStepper, useFiles } from 'hooks';
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

export default withFileProtection(function Process() {
  const navigate = useNavigate();
  const { previousStep, nextStep } = useStepper();
  const { files } = useFiles();

  const handlePrevious = () => {
    previousStep();
    navigate('/preview');
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
              <Subtitle size="sm">
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
        <Button onClick={handleNext}>Siguiente</Button>
      </Footer>
    </>
  );
});
