import { useNavigate } from 'react-router-dom';

import {
  Text,
  Button,
  Title,
  Card,
  Subtitle,
  Arrow,
  Stack,
  Grid,
  HiddenInput,
  PreviousButton,
} from 'components';
import { useFiles, useStepper } from 'hooks';
import { Footer, Section } from 'layout/main';

export default function Preview() {

  const { previousStep } = useStepper();
  const { removeAllFiles, } = useFiles();

  const handlePrevious = () => {
    removeAllFiles();
    previousStep();
    navigate('/onboarding');
  };

  return (
    <>
      {/* MAIN SECTION */}
      <Section spacing="xl">
        <PreviousButton onClick={handlePrevious}>
          1. Previsualización de archivos
        </PreviousButton>
        <Card>
          <Subtitle>Archivos seleccionados</Subtitle>
          <Grid
            columns={5}
            spacing="xl"
            justify="center"
            css={{ width: '100%' }}
          >
          </Grid>
        </Card>
      </Section>

      {/* FOOTER */}
      <Footer>
        <HiddenInput
          type="file"
          accept=".doc,.docx"
          multiple
        />
        <Text size="sm">Formatos válidos: .doc y .docx</Text>
        <Button>Continuar</Button>
      </Footer>
    </>
  );
}
