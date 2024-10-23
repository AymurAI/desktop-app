import {
  ArrowBendUpLeft,
  Database,
  Detective,
  HardDrives,
  Monitor,
} from "phosphor-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button, Input, Label, Stack, Subtitle, Title } from "components";
import { useLogin, useUser, useServerUrl } from "hooks";
import { Background, Container } from "layout/login";
import { FunctionType } from "types/user";

export default function Login() {
  const navigate = useNavigate();
  const user = useUser();

  const { login } = useLogin();
  const { setServerUrl } = useServerUrl();
  const [isLocal, setIsLocal] = useState(user ? !user?.online : false);
  const [hasToChooseUrl, setHasToChooseUrl] = useState(false);
  const [inputValue, setInputValue] = useState(
    localStorage.getItem("serverUrl") ?? ""
  );
  const [isConnected, setIsConnected] = useState(false);

  /**
   * Ensures the user state has been successfully updated before navigating to the `/home`
   */
  useEffect(() => {
    if (user && user.function !== "") navigate("/onboarding");
  }, [user, navigate]);

  const handleUrlSubmit = () => {
    setHasToChooseUrl(false);
    localStorage.setItem("serverUrl", inputValue);
    setServerUrl(inputValue);
    setIsConnected(true);
  };

  const handleLocalConnection = () => {
    setIsLocal(true);
    localStorage.setItem("serverUrl", "");
  };

  return (
    <Background>
      <Container>
        <Stack
          direction="column"
          justify="center"
          align="center"
          style={{ flex: 1 }}
        >
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
            css={{ width: 400, minHeight: "240px" }}
          >
            {!isLocal && !hasToChooseUrl && !isConnected && (
              <>
                <Subtitle
                  weight="strong"
                  size="s"
                  css={{ textAlign: "center" }}
                >
                  ¿Cómo prefieres conectarte a AymurAI?
                </Subtitle>
                {/* Buttons */}
                <Stack direction="column" align="center" spacing="s">
                  <Button onClick={() => handleLocalConnection()}>
                    <Monitor weight="bold" />
                    Local
                  </Button>
                  <Subtitle size="s">o</Subtitle>
                  <Button onClick={() => setHasToChooseUrl(true)}>
                    <HardDrives weight="bold" />
                    Servidor
                  </Button>
                  {/* <Button onClick={login.withGoogle}>
                    <GoogleLogo weight="bold" />
                    Google
                  </Button> */}
                </Stack>
              </>
            )}

            {(isLocal || isConnected) && (
              <>
                <Subtitle
                  weight="strong"
                  size="s"
                  css={{ textAlign: "center" }}
                >
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
                <Button
                  variant={"secondary"}
                  onClick={() => {
                    setIsConnected(false);
                    setIsLocal(false);
                  }}
                >
                  <ArrowBendUpLeft weight="bold" />
                  Volver al inicio
                </Button>
              </>
            )}
            {hasToChooseUrl && (
              <Stack spacing="m" align="center" w-full justify="center">
                <Subtitle
                  weight="strong"
                  size="s"
                  css={{ textAlign: "center" }}
                >
                  Ingresa la dirección del servidor al que deseas conectarte
                </Subtitle>
                <Input
                  label="Dirección del servidor"
                  css={{ minWidth: "300px" }}
                  onChange={(value) => setInputValue(value)}
                  defaultValue={inputValue}
                />
                <Button
                  disabled={!inputValue}
                  css={{ width: "100%" }}
                  onClick={handleUrlSubmit}
                >
                  Conectar
                </Button>
                <Button
                  css={{ width: "100%" }}
                  variant={"secondary"}
                  onClick={() => {
                    setHasToChooseUrl(false);
                    setInputValue("");
                    setIsConnected(false);
                  }}
                >
                  <ArrowBendUpLeft weight="bold" />
                  Volver al inicio
                </Button>
              </Stack>
            )}
          </Stack>
        </Stack>

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
      </Container>
    </Background>
  );
}
