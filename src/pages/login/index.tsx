import {
  ArrowBendUpLeft,
  Database,
  Detective,
  HardDrives,
  Monitor,
} from "phosphor-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button, Input, Label, Stack, Subtitle, Text, Title } from "components";
import { useLogin, useUser, useServerUrl } from "hooks";
import { Background, Container } from "layout/login";
import { FunctionType } from "types/user";
import { getHealthCheck } from "services/aymurai";

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
  const [error, setError] = useState("");
  /**
   * Ensures the user state has been successfully updated before navigating to the `/home`
   */
  useEffect(() => {
    if (user && user.function !== "") navigate("/onboarding");
  }, [user, navigate]);

  const handleUrlSubmit = async () => {
    const response = await getHealthCheck(inputValue);
    if (response === 200) {
      setHasToChooseUrl(false);
      localStorage.setItem("serverUrl", inputValue);
      setError("");
      setServerUrl(inputValue);
      setIsConnected(true);
      return;
    } else {
      if (response === "Request failed with status code 404") {
        setError("La dirección ingresada no es correcta");
      } else {
        setError("En este momento no es posible conectarse con el servidor");
      }
    }
  };

  const handleLocalConnection = async () => {
    if (window.electronAPI) {
      try {
        await window.electronAPI.runBatch();
        console.log("Server is running in the background.");
      } catch (error) {
        console.error(
          "Failed to run batch. Please run the server manually.",
          error
        );
        alert(
          "No se pudo inicializar el servidor automáticamente. Por favor inícialo manualmente."
        );
      }
    } else {
      console.warn("Electron API not available. Unable to run the batch file.");
      alert(
        "No se puede inicializar el servidor automáticamente. Por favor, inícialo manualmente."
      );
    }

    // Update state and storage regardless of the batch process result
    setIsLocal(true);
    setServerUrl("");
    setError("");
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
                    setError("");
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
                <Stack
                  direction="column"
                  spacing={"none"}
                  css={{ marginBottom: "$space$m" }}
                >
                  <Input
                    label="Dirección del servidor"
                    css={{
                      minWidth: "300px",
                      position: "relative",
                    }}
                    onChange={(value) => setInputValue(value)}
                    defaultValue={inputValue}
                  />
                  {error && (
                    <div>
                      <Label
                        css={{ color: "$errorPrimary", position: "absolute" }}
                        size="s"
                      >
                        Error de conexión: {error}{" "}
                      </Label>
                    </div>
                  )}
                </Stack>
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
                    setError("");
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
