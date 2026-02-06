import { useConnectToHost } from "@/services/aymurai";
import * as localStore from "@/store/useLocal";
import { css } from "@/styled/css";
import { Stack } from "@/styled/jsx";
import { useNavigate } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { ArrowLeft } from "phosphor-react";
import { type ChangeEventHandler, useState } from "react";
import { ZodError } from "zod";
import Button from "../button";
import Input from "../input";

const BackButton = ({ onClick }: { onClick: () => void }) => (
  <button
    className={css({
      cursor: "pointer",
      position: "absolute",
      top: "8",
      left: "8",
    })}
    type="button"
    onClick={onClick}
  >
    <ArrowLeft size={32} />
  </button>
);

interface ConnectToHostProps {
  onBackClick: () => void;
}
export default function ConnectToHost({ onBackClick }: ConnectToHostProps) {
  const navigate = useNavigate();
  const remoteHost = localStore.useServerHost() ?? "";
  const { setServerHost } = localStore.useServerHostActions();

  const [host, setHost] = useState(remoteHost);

  const { mutate: connectToHost, isPending, error, reset } = useConnectToHost();

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setHost(e.target.value);
    reset();
  };

  const tryConnection = () => {
    connectToHost(host, {
      onSuccess: () => {
        setServerHost(host);
        navigate({
          to: "/home/features",
        });
      },
    });
  };

  return (
    <>
      <BackButton onClick={onBackClick} />
      <Stack justify="center" gap="3" width="[400px]">
        <h2 className={css({ textStyle: "subtitle.sm.strong" })}>
          Ingresa la dirección del servidor al que deseas conectarte
        </h2>

        <Stack gap="1" width="full">
          <Input
            label="Direccion del servidor"
            placeholder="http://"
            value={host}
            onChange={handleChange}
            error={error ? errorMessage(error) : undefined}
          />
        </Stack>

        <Button onClick={tryConnection} isLoading={isPending}>
          Guardar y conectar
        </Button>
      </Stack>
    </>
  );
}

function errorMessage(err: Error | null): string {
  console.error(err);
  if (err instanceof AxiosError) {
    if (err.code === "ERR_NETWORK") return "No se pudo conectar al servidor";
    return "Error de conexión";
  }

  if (err instanceof ZodError) {
    return "El servidor no respondió correctamente";
  }

  if (err instanceof TypeError) {
    return "El formato de la URL es incorrecto.";
  }

  return "Error desconocido";
}
