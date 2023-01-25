import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogo, Monitor } from 'phosphor-react';

import { Background, Container } from 'layout/login';
import { Button, Subtitle, Title, Stack, Label } from 'components';
import { useLogin, useUser } from 'hooks';
import Callout from './Callout';

export default function Login() {
  const navigate = useNavigate();
  const user = useUser();

  const { login } = useLogin();

  /**
   * Ensures the user state has been successfully updated before navigating to the `/home`
   */
  useEffect(() => {
    if (user) navigate('/onboarding');
  }, [user, navigate]);

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
        <Stack
          direction="column"
          spacing="m"
          align="stretch"
          css={{ width: 300 }}
        >
          <Subtitle weight="strong" size="s" css={{ textAlign: 'center' }}>
            ¿Donde prefieres guardar la información que proceses con AymurAI?
          </Subtitle>

          {/* Buttons */}
          <Stack direction="column" align="center" spacing="s">
            <Button onClick={login.offline}>
              <Monitor weight="bold" />
              Local
            </Button>
            <Subtitle size="s">o</Subtitle>
            <Button onClick={login.online}>
              <GoogleLogo weight="bold" />
              Login
            </Button>
          </Stack>

          {/* Callout */}
          <Callout />
        </Stack>

        {/* DataGenero info */}
        <Stack
          direction="column"
          align="center"
          style={{ position: 'fixed', bottom: 48 }}
        >
          <Label size="s">Plataforma hecha por</Label>
          <a
            href="https://www.datagenero.org/"
            target="_blank"
            rel="noreferrer"
          >
            <img src="brand/data-genero.png" alt="DataGenero" width={127} />
          </a>
        </Stack>
      </Container>
    </Background>
  );
}
