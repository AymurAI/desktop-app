import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GoogleLogo,
  Monitor,
  Detective,
  Database,
  ArrowBendUpLeft,
} from "phosphor-react";

import { Background, Container } from "layout/login";
import { Button, Subtitle, Title, Stack, Label } from "components";
import { useLogin, useUser } from "hooks";
import Callout from "./Callout";
import { FunctionType } from "types/user";

export default function Login() {
  const navigate = useNavigate();
  const user = useUser();

  const { login } = useLogin();
  const [isLocal, setIsLocal] = useState(false);

  /**
   * Ensures the user state has been successfully updated before navigating to the `/home`
   */
  useEffect(() => {
    if (user) navigate("/onboarding");
  }, [user, navigate]);

  return (
    <Background>
      <Container>
        {/*  Title */}
        <Stack direction="column" align="center">
          <Subtitle>Te damos la bienvenida a</Subtitle>
          <Title weight="heavy" size="main">
            AymurAI
          </Title>
        </Stack>

        {/* Login */}
        <Stack
          direction="column"
          spacing="m"
          align="stretch"
          css={{ width: 300 }}
        >
          {!isLocal && (
            <>
              <Subtitle weight="strong" size="s" css={{ textAlign: "center" }}>
                ¿Donde prefieres guardar la información que proceses con
                AymurAI?
              </Subtitle>
              {/* Buttons */}
              <Stack direction="column" align="center" spacing="s">
                <Button onClick={() => setIsLocal(true)}>
                  <Monitor weight="bold" />
                  Local
                </Button>
                <Subtitle size="s">o</Subtitle>
                <Button onClick={login.online}>
                  <GoogleLogo weight="bold" />
                  Google
                </Button>
              </Stack>

              {/* Callout */}
              <Callout />
            </>
          )}

          {isLocal && (
            <>
              <Subtitle weight="strong" size="s" css={{ textAlign: "center" }}>
                ¿Cual función vas a utilizar?
              </Subtitle>
              <Button onClick={() => login.offline(FunctionType.DATASET)}>
                <Database weight="bold" />
                Set de datos
              </Button>
              <Subtitle size="s" css={{ textAlign: "center" }}>
                o
              </Subtitle>
              <Button onClick={() => login.offline(FunctionType.ANONYMIZER)}>
                <Detective weight="bold" />
                Anonimizador
              </Button>
              <Button variant={"secondary"} onClick={() => setIsLocal(false)}>
                <ArrowBendUpLeft weight="bold" />
                Volver al inicio
              </Button>
            </>
          )}
        </Stack>

        {/* DataGenero info */}
        <Stack
          direction="column"
          align="center"
          style={{ position: "fixed", bottom: 48 }}
        >
          <Label size="s">Plataforma hecha por</Label>
          <a
            href="https://www.datagenero.org/"
            target="_blank"
            rel="noreferrer"
          >
            <img src="brand/data-genero.png" alt="DataGenero" width={170} />
          </a>
        </Stack>
      </Container>
    </Background>
  );
}
