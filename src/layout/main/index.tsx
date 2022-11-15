import { Outlet } from 'react-router-dom';

import { Title, Text, ProfilePicture } from 'components';
import { Props } from './Main.types';
import { Container, Header } from './Main.styles';

export default function Main({ children, ...props }: Props) {
  return (
    <main {...props}>
      <Header>
        {/* Title & Profile picture & Logout */}
        <Title weight="strong" css={{ fontSize: 24 }}>
          AymurAI
        </Title>
        <Text>Im the stepper</Text>
        <div>
          <ProfilePicture src="https://place-puppy.com/300x300"></ProfilePicture>
          <button>logout</button>
        </div>
      </Header>

      {/* Content as Outlet, managed by React-Router */}
      <Container>
        <Outlet></Outlet>
      </Container>
    </main>
  );
}
