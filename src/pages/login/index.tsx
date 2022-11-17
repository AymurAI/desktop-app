import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Background, Container } from 'layout/login';
import { Subtitle, Title, Stack } from 'components';
import { useGoogleToken, useLogin } from 'hooks';
import { Button } from 'components';

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
        <Stack direction="column" align="center">
          <Button onClick={() => login()}>Login</Button>
        </Stack>

        {/* DataGenero info */}
      </Container>
    </Background>
  );
}
