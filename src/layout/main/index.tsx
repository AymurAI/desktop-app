import { Outlet } from "react-router-dom";

import { ProfileInfo, Stepper, Title } from "@/components";
import FileProvider from "@/context/File";
import withAuthProtection from "@/features/withAuthProtection";
import { useUser } from "@/hooks";
import { FunctionType } from "@/types/user";
import { Footer, Header, Layout, Section } from "./Main.styles";
import type { Props } from "./Main.types";

export { Section, Footer };

export default withAuthProtection(function Main({ children, ...props }: Props) {
  const user = useUser();

  return (
    <Layout {...props}>
      <Header>
        {/* Title & Profile picture & Logout */}
        <Title weight="strong" css={{ fontSize: 24 }}>
          AymurAI{" "}
          {user?.function === FunctionType.ANONYMIZER
            ? "Anonimizador"
            : "Set de datos"}
        </Title>
        <Stepper />
        <ProfileInfo />
      </Header>

      <FileProvider>
        {/* Content as Outlet, managed by React-Router */}
        <Outlet />
      </FileProvider>
    </Layout>
  );
});
