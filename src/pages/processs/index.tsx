import { useNavigate } from 'react-router-dom';

import { useStepper } from 'hooks';
import { Footer, Section } from 'layout/main';
import {
  Button,
} from 'components';
import withFileProtection from 'features/withFileProtection';

export default withFileProtection(function Process() {
  const navigate = useNavigate();
  const { previousStep } = useStepper();

  const handleNext = () => {
    nextStep();
    navigate('/validation');
  };

  return (
    <>
      <Section>
      </Section>
      <Footer>
        <Button onClick={handleNext}>Siguiente</Button>
      </Footer>
    </>
  );
});
