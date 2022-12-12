import { useNavigate } from 'react-router-dom';

import {
  Card,
  FileCheck,
  Grid,
  SectionTitle,
  Subtitle,
  Text,
  Button,
} from 'components';
import { useFileDispatch, useFiles } from 'hooks';
import { Footer, Section } from 'layout/main';
import { removeAllFiles } from 'reducers/file/actions';
import { Anchor } from './Anchor';
import { DATASET_URL } from 'utils/config';

export default function Finish() {
  const files = useFiles();
  const dispatch = useFileDispatch();
  const navigate = useNavigate();

  const handleRestart = () => {
    dispatch(removeAllFiles());
    navigate('/onboarding');
  };

  return (
    <>
      <Section>
        <SectionTitle>4. Finalización</SectionTitle>
        <Text css={{ maxWidth: '60%' }}>
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
              <FileCheck key={data.name} fileName={data.name}></FileCheck>
            ))}
          </Grid>
        </Card>
      </Section>
      <Footer>
        <Anchor
          href="https://www.datagenero.org/"
          target="_blank"
          rel="noreferrer"
        >
          <img src="/brand/data-genero.png" alt="DataGenero" width={127} />
        </Anchor>
        <Button
          css={{ textDecoration: 'none' }}
          variant="secondary"
          as="a"
          href={DATASET_URL}
          target="_blank"
          rel="noreferrer"
        >
          Ver set de datos
        </Button>
        <Button onClick={handleRestart}>Cargar más documentos</Button>
      </Footer>
    </>
  );
}
