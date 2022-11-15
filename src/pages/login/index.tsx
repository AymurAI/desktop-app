import { Background, Container } from 'layout/login';
import { Text, Title } from 'components';

export default function Login() {
  return (
    <Background>
      <Container>
        <Text>Te damos la bienvenida a</Text>
        <Title>AymurAI</Title>
        <button>Login</button>
      </Container>
    </Background>
  );
}
