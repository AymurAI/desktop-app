import { Outlet } from 'react-router-dom';

import { Title, ProfileInfo } from 'components';
import withAuthProtection from 'features/withAuthProtection';
import { Props } from './Main.types';
import { Section, Footer, Header, Layout } from './Main.styles';

export { Section, Footer };

export default withAuthProtection(function Main({ children, ...props }: Props) {
  return (
    <Layout {...props}>
      <Header>
        {/* Title & Profile picture & Logout */}
        <Title weight="strong" css={{ fontSize: 24 }}>
          AymurAI
        </Title>
        <ProfileInfo></ProfileInfo>
      </Header>

      {/* Content as Outlet, managed by React-Router */}
      <Outlet></Outlet>
    </Layout>
  );
});
