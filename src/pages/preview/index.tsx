
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
} from 'components';
import { Footer, Section } from 'layout/main';

export default function Preview() {

  return (
    <>
      {/* MAIN SECTION */}
      <Section spacing="xl">
        <Title>
          <Stack>
            <Button
              variant="none"
              size="s"
              css={{ p: 0, alignSelf: 'center' }}
            >
              <Arrow.Left></Arrow.Left>
            </Button>
            1. Previsualización de archivos
          </Stack>
        </Title>
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
