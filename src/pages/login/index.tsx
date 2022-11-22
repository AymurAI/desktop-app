import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogo } from 'phosphor-react';

import { Background, Container } from 'layout/login';
import { Button, Subtitle, Title, Stack, Label } from 'components';
import { useLogin, useUser, useGoogleScript } from 'hooks';
import Callout from './Callout';

export default function Login() {
  const navigate = useNavigate();
  const user = useUser();
  const hasScriptLoaded = useGoogleScript();

  const { login } = useLogin();

  /**
   * Ensures the user state has been successfully updated before navigating to the `/home`
   */
  useEffect(() => {
    if (user && user.token !== '') navigate('/onboarding');
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
        <Stack direction="column" align="stretch" spacing="xl">
          <Button onClick={() => login()} disabled={!hasScriptLoaded}>
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
