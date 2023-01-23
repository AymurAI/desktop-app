import { Outlet } from 'react-router-dom';

import { Title, ProfileInfo, Stepper } from 'components';
import { Props } from './Main.types';
import { Section, Footer, Header, Layout } from './Main.styles';
import FileProvider from 'context/File';

export { Section, Footer };

export default function Main({ children, ...props }: Props) {
  return (
    <Layout {...props}>
      <Header>
        {/* Title & Profile picture & Logout */}
        <Title weight="strong" css={{ fontSize: 24 }}>
          AymurAI
        </Title>
        <Stepper></Stepper>
        <ProfileInfo></ProfileInfo>
      </Header>

      <FileProvider>
        {/* Content as Outlet, managed by React-Router */}
        <Outlet></Outlet>
      </FileProvider>
    </Layout>
  );
}
