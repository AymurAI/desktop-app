
import {
  Text,
  Button,
  Title,
  Card,
  Subtitle,
  Stack,
  Grid,
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
        <Text size="sm">Formatos válidos: .doc y .docx</Text>
        <Button>Continuar</Button>
      </Footer>
    </>
  );
}
