import {
  Card,
  FileCheck,
  Grid,
  SectionTitle,
  Subtitle,
  Text,
} from 'components';
import { useFileDispatch, useFiles } from 'hooks';
import { Footer, Section } from 'layout/main';

export default function Finish() {
  const files = useFiles();

  return (
    <>
      <Section>
        <SectionTitle>4. Finalización</SectionTitle>
        <Text>
          Los datos encontrados por AymurAI y posteriormente validados ya son
          parte del set de datos abiertos con perspectiva de género.
        </Text>

        <Card>
          <Subtitle>Archivos procesados</Subtitle>
          <Grid
            columns={5}
            spacing="xl"
            justify="center"
            css={{ width: '100%' }}
          >
            {files.map(({ data }) => (
              <FileCheck fileName={data.name}></FileCheck>
            ))}
          </Grid>
        </Card>
      </Section>
      <Footer>
      </Footer>
    </>
  );
}
