import { useState } from 'react';
import { Outlet } from 'react-router-dom';

import { Title, ProfileInfo } from 'components';
import withAuthProtection from 'features/withAuthProtection';
import FileContext from 'context/File';
import { Props } from './Main.types';
import { Section, Footer, Header, Layout } from './Main.styles';

export { Section, Footer };

export default withAuthProtection(function Main({ children, ...props }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [step, setStep] = useState<number>(0);

  const handleSetFiles = (newFiles: File[]) => setFiles(newFiles);
  const handleSetStep = (newStep: number) => setStep(newStep);

  return (
    <Layout {...props}>
      <Header>
        {/* Title & Profile picture & Logout */}
        <Title weight="strong" css={{ fontSize: 24 }}>
          AymurAI
        </Title>
        <ProfileInfo></ProfileInfo>
      </Header>

      <FileContext.Provider
        value={{
          files,
          setFiles: handleSetFiles,
          step,
          setStep: handleSetStep,
        }}
      >
        {/* Content as Outlet, managed by React-Router */}
        <Outlet></Outlet>
      </FileContext.Provider>
    </Layout>
  );
});
