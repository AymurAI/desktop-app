import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogo } from 'phosphor-react';

import { Background, Container } from 'layout/login';
import { Subtitle, Title, Stack, Label } from 'components';
import { useGoogleToken, useLogin } from 'hooks';
import { Button } from 'components';
import Callout from './Callout';

export default function Login() {
  const navigate = useNavigate();
  const token = useGoogleToken();

  const { login } = useLogin();

  /**
   * Ensures the token state has been successfully updated before navigating to the `/home`
   */
  useEffect(() => {
    if (token && token !== '') navigate('/home');
  }, [token, navigate]);

  return (
    <Background>
      <Container>
        {/*  Title */}
        <Stack direction="column" align="center">
          <Subtitle>Te damos la bienvenida a</Subtitle>
          <Title weight="heavy" size="main">
            AymurAI
          </Title>
        </Stack>

        {/* Login */}
        <Stack direction="column" align="stretch" spacing="xl">
          <Button onClick={() => login()}>
            <GoogleLogo weight="bold" />
            Login
          </Button>
          <Callout />
        </Stack>

        {/* DataGenero info */}
        <Stack
          direction="column"
          align="center"
          style={{ position: 'fixed', bottom: 48 }}
        >
          <Label size="sm">Plataforma hecha por</Label>
          <a
            href="https://www.datagenero.org/"
            target="_blank"
            rel="noreferrer"
          >
            <img src="/brand/data-genero.png" alt="DataGenero" width={127} />
          </a>
        </Stack>
      </Container>
    </Background>
  );
}
