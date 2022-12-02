import { useState } from 'react';
import { Outlet } from 'react-router-dom';

import { Title, ProfileInfo, Stepper } from 'components';
import withAuthProtection from 'features/withAuthProtection';
import FileContext from 'context/File';
import { Props } from './Main.types';
import { Section, Footer, Header, Layout } from './Main.styles';
import { DocFile } from 'types/file';

export { Section, Footer };

export default withAuthProtection(function Main({ children, ...props }: Props) {
  const [files, setFiles] = useState<DocFile[]>([]);
  const [step, setStep] = useState<number>(0);

  return (
    <Layout {...props}>
      <Header>
        {/* Title & Profile picture & Logout */}
        <Title weight="strong" css={{ fontSize: 24 }}>
          AymurAI
        </Title>
        <Stepper currentStep={step}></Stepper>
        <ProfileInfo></ProfileInfo>
      </Header>

      <FileContext.Provider
        value={{
          files,
          setFiles,
          step,
          setStep,
        }}
      >
        {/* Content as Outlet, managed by React-Router */}
        <Outlet></Outlet>
      </FileContext.Provider>
    </Layout>
  );
});
