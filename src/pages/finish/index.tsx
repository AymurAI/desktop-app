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
import { useFileDispatch, useFiles, useUser } from 'hooks';
import { Footer, Section } from 'layout/main';
import { removeAllFiles } from 'reducers/file/actions';
import { Anchor } from './Anchor';
import { DATASET_URL } from 'utils/config';
import Callout from './Callout';
import filesystem from 'services/filesystem';
import { useEffect } from 'react';
import { submitValidations } from 'utils/file';

export default function Finish() {
  const files = useFiles();
  const dispatch = useFileDispatch();
  const navigate = useNavigate();
  const user = useUser();

  const handleRestart = () => {
    dispatch(removeAllFiles());
    navigate('/onboarding');
  };

  // At first render, submit all the data
  useEffect(() => {
    const f = async () => {
      if (user) {
        // POST the validated data to the dataset
        await submitValidations({
          isOnline: user.online,
          token: user.token,
          validations: files.map((v) => v.validationObject),
        });

        // Export the feedback JSON
        await filesystem.feedback.export(files);
      }
    };

    f();

    // We strictly need to run this effect once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          <Callout />
        </Card>
      </Section>
      <Footer>
        <Anchor
          href="https://www.datagenero.org/"
          target="_blank"
          rel="noreferrer"
        >
          <img src="brand/data-genero.png" alt="DataGenero" width={127} />
        </Anchor>
        {user?.online ? (
          <Button
            css={{ textDecoration: 'none' }}
            variant="secondary"
            as="a"
            href={DATASET_URL}
            target="_blank"
            rel="noreferrer"
            size="l"
          >
            Ver set de datos
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="l"
            onClick={() => filesystem.excel.open()}
          >
            Ver set de datos
          </Button>
        )}

        <Button onClick={handleRestart} size="l">
          Cargar más documentos
        </Button>
      </Footer>
    </>
  );
}
