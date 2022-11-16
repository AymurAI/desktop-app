import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Background, Container } from 'layout/login';
import { Text, Title } from 'components';
import { useGoogleToken, useLogin } from 'hooks';

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
        <Text>Te damos la bienvenida a</Text>
        <Title>AymurAI</Title>
        <button onClick={() => login()}>Login</button>
      </Container>
    </Background>
  );
}
