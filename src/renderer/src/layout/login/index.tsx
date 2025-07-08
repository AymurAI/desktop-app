import { Button, Label, Stack, Subtitle, Title } from "@/components";
import { ArrowBendUpLeft } from "phosphor-react";
import { Outlet, useNavigate } from "react-router-dom";
import * as S from "./Login.styles";

interface LoginLayoutProps {
  canGoBack?: boolean;
}
export default function LoginLayout({ canGoBack = false }: LoginLayoutProps) {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate("/login");
  };
  return (
    <S.Background>
      <S.Container>
        <S.MainContent direction="column" justify="center" align="center">
          {/*  Title */}
          <Stack direction="column" align="center">
            <Subtitle>Te damos la bienvenida a</Subtitle>
            <Title weight="heavy" size="main">
              AymurAI
            </Title>
          </Stack>

          {/* Outlet: buttons and actions to proceed to the platform */}
          <Outlet />

          {canGoBack && (
            <Button variant="secondary" onClick={handleGoBack}>
              <ArrowBendUpLeft weight="bold" />
              Volver al inicio
            </Button>
          )}
        </S.MainContent>

        {/* DataGenero info */}
        <Stack direction="column" align="center" spacing="none">
          <Label size="s">Plataforma hecha por</Label>
          <a
            href="https://www.datagenero.org/"
            target="_blank"
            rel="noreferrer"
          >
            <img src="brand/data-genero.png" alt="DataGenero" width={170} />
          </a>
        </Stack>
      </S.Container>
    </S.Background>
  );
}
