import { AxiosError } from "axios";
import { ArrowBendUpLeft, HardDrives, Monitor } from "phosphor-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button, Input, Label, Stack, Subtitle } from "@/components";

import { useConnectToHost } from "@/services/aymurai/useConnectToHost";
import { localStore } from "@/store/useLocal";

const errorMessage = (err: Error) => {
  if (!(err instanceof AxiosError)) {
    return "Error desconocido";
  }

  if (err.code === "ERR_NETWORK") return "No se pudo conectar al servidor";
  return "Error de conexión";
};

export function Host() {
  const navigate = useNavigate();

  const [isLocal, setIsLocal] = useState<boolean | null>(null);

  const remoteHost = localStore.useServerHost() ?? "";
  const { setServerHost } = localStore.useServerHostActions();
  const { mutate: connectToHost, isPending, error, reset } = useConnectToHost();

  const handleBack = () => {
    setIsLocal(null);
  };

  const handleUseLocal = async () => {
    if (window.electronAPI) {
      try {
        await window.electronAPI.runBatch();
        console.log("Server is running in the background.");

        navigate("/login/features");
      } catch (error) {
        console.error(
          "Failed to run batch. Please run the server manually.",
          error,
        );
        alert(
          "No se pudo inicializar el servidor automáticamente. Por favor inícialo manualmente.",
        );
      }
    } else {
      console.warn("Electron API not available. Unable to run the batch file.");
      alert(
        "No se puede inicializar el servidor automáticamente. Por favor, inícialo manualmente.",
      );
    }
  };

  const handleUseRemote = () => {
    setIsLocal(false);
  };

  const tryConnection = () => {
    connectToHost(remoteHost, {
      onSuccess: () => navigate("/login/features"),
    });
  };

  const handleHostChange = (value: string) => {
    setServerHost(value);
    reset();
  };

  return (
    <Stack
      direction="column"
      spacing="m"
      align="stretch"
      css={{ width: 400, minHeight: "240px" }}
    >
      {/* Not yet selected */}
      {isLocal === null && (
        <>
          <Subtitle weight="strong" size="s" css={{ textAlign: "center" }}>
            ¿Cómo prefieres conectarte a AymurAI?
          </Subtitle>
          {/* Buttons */}
          <Stack direction="column" align="center" spacing="s">
            <Button onClick={handleUseLocal}>
              <Monitor weight="bold" />
              Local
            </Button>
            <Subtitle size="s">o</Subtitle>
            <Button onClick={handleUseRemote}>
              <HardDrives weight="bold" />
              Servidor
            </Button>
          </Stack>
        </>
      )}

      {/* Remote host option selected */}
      {isLocal === false && (
        <Stack spacing="m" align="center" w-full justify="center">
          <Subtitle weight="strong" size="s" css={{ textAlign: "center" }}>
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
              onChange={handleHostChange}
              defaultValue={remoteHost}
            />
            {error && (
              <div>
                <Label
                  css={{ color: "$errorPrimary", position: "absolute" }}
                  size="s"
                >
                  Error de conexión: {errorMessage(error)}
                </Label>
              </div>
            )}
          </Stack>
          <Button
            disabled={!remoteHost || isPending}
            css={{ width: "100%" }}
            onClick={tryConnection}
          >
            Conectar
          </Button>
          <Button
            css={{ width: "100%" }}
            variant={"secondary"}
            onClick={handleBack}
          >
            <ArrowBendUpLeft weight="bold" />
            Volver al inicio
          </Button>
        </Stack>
      )}
    </Stack>
  );
}
