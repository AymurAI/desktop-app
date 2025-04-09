import { useContext, useEffect, useState } from 'react';

import { Footer, Section } from 'layout/main';
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
import { removeAllFiles } from 'reducers/file/actions';
import { useNavigate } from 'react-router-dom';
import { anonymize } from 'services/aymurai';

import Anchor from '../Anchor';
import { ServerUrlContext } from 'context/ServerUrl';

const changeExtension = (name: string) => {
  const parts = name.split('.');
  parts.pop();
  return [...parts].join('.') + '_anonimizado.odt';
};

type AnonymizeStatus = 'loading' | 'success' | 'error';
export default function Anonymizer() {
  // We are sure that there is only one file, because we came from
  // anonimization workflow
  const file = useFiles()[0];
  const dispatch = useFileDispatch();
  const navigate = useNavigate();
  const [status, setStatus] = useState<AnonymizeStatus | null>(null);
  const [fileURI, setFileURI] = useState<string | null>(null);
  const { serverUrl } = useContext(ServerUrlContext);
  const downloadDocument = async () => {
    if (!fileURI) {
      console.error('Tried to download a file that is not ready.');
      return;
    }
    const link = document.createElement('a');
    link.setAttribute('href', fileURI);
    link.setAttribute('download', changeExtension(file.data.name));

    link.click();
  };

  const handleRestart = () => {
    dispatch(removeAllFiles());
    navigate('/onboarding');
  };

  useEffect(() => {
    setStatus('loading');

    anonymize(file, serverUrl)
      .then((blob) => {
        setFileURI(URL.createObjectURL(blob));
        setStatus('success');
      })
      .catch(() => {
        setStatus('error');
      });
  }, []);

  return (
    <>
      <Section>
        <SectionTitle>4. Finalización</SectionTitle>
        <Text css={{ maxWidth: '60%' }}>
          Los datos encontrados por AymurAI y posteriormente validados ya han
          sido anonimizados correctamente.
        </Text>
        <Card>
          <Subtitle>Archivo procesado</Subtitle>
          <Grid
            columns={4}
            spacing="xl"
            justify="center"
            css={{ width: '100%' }}
          >
            <FileCheck
              fileName={file.data.name}
              hasError={status === 'error'}
              isLoading={status === 'loading'}
            ></FileCheck>
          </Grid>
        </Card>
      </Section>
      <Footer>
        <Anchor
          href="https://www.datagenero.org/"
          target="_blank"
          rel="noreferrer"
        >
          <img src="brand/data-genero.png" alt="DataGenero" width={150} />
        </Anchor>
        <Button variant="secondary" onClick={handleRestart} size="l">
          Cargar un nuevo documento
        </Button>
        <Button
          onClick={downloadDocument}
          size="l"
          disabled={status === 'error'}
        >
          Descargar documento
        </Button>
      </Footer>
    </>
  );
}
