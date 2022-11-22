import { Outlet } from 'react-router-dom';

import { Title, Text } from 'components';
import withAuthProtection from 'features/withAuthProtection';
import ProfileInfo from 'components/profile-info';
import { Props } from './Main.types';
import { Container, Header } from './Main.styles';

export default withAuthProtection(function Main({ children, ...props }: Props) {
  return (
    <main {...props}>
      <Header>
        {/* Title & Profile picture & Logout */}
        <Title weight="strong" css={{ fontSize: 24 }}>
          AymurAI
        </Title>
        <Text>Im the stepper</Text>
        <ProfileInfo></ProfileInfo>
      </Header>

      {/* Content as Outlet, managed by React-Router */}
      <Container>
        <Outlet></Outlet>
      </Container>
    </main>
  );
});
