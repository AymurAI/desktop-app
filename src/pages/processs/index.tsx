import { useNavigate } from 'react-router-dom';

import { useStepper } from 'hooks';
import { Footer, Section } from 'layout/main';
import {
  SectionTitle,
  Button,
} from 'components';
import withFileProtection from 'features/withFileProtection';

export default withFileProtection(function Process() {
  const navigate = useNavigate();
  const { previousStep, nextStep } = useStepper();
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
      </Section>
      <Footer>
        <Button onClick={handleNext}>Siguiente</Button>
      </Footer>
    </>
  );
});
