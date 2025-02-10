import { Outlet } from "react-router-dom";

import { Title, ProfileInfo, Stepper } from "components";
import withAuthProtection from "features/withAuthProtection";
import { Props } from "./Main.types";
import { Section, Footer, Header, Layout } from "./Main.styles";
import FileProvider from "context/File";
import { useUser } from "hooks";
import { FunctionType } from "types/user";

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
        <Stepper></Stepper>
        <ProfileInfo></ProfileInfo>
      </Header>

      <FileProvider>
        {/* Content as Outlet, managed by React-Router */}
        <Outlet></Outlet>
      </FileProvider>
    </Layout>
  );
});
