import { Outlet } from "react-router-dom";

import { ProfileInfo, Stepper, Title } from "@/components";
import FileProvider from "@/context/File";
import TranscriptionProvider from "@/context/Transcription";
import FeatureRouter from "@/features/FeatureRouter";
import { Footer, Header, Layout, Section } from "./Main.styles";
import type { Props } from "./Main.types";

export { Footer, Section };

function GenericMain({ title }: Props) {
  return (
    <Layout>
      <Header>
        {/* Title & Profile picture & Logout */}
        <Title weight="strong" css={{ fontSize: 24 }}>
          AymurAI {title}
        </Title>
        <Stepper />
        <ProfileInfo />
      </Header>

      <TranscriptionProvider>
        <FileProvider>
          {/* Content as Outlet, managed by React-Router */}
          <Outlet />
        </FileProvider>
      </TranscriptionProvider>
    </Layout>
  );
}

export default function Main() {
  return (
    <FeatureRouter
      DATA_SET={<GenericMain title="Set de datos" />}
      ANONYMIZER={<GenericMain title="Anonimizador" />}
    />
  );
}
