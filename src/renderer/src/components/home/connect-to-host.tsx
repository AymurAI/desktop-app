import { useConnectToHost } from "@/services/aymurai";
import * as localStore from "@/store/useLocal";
import { css } from "@/styled/css";
import { Stack } from "@/styled/jsx";
import { isElectronApp } from "@/utils/app-mode";
import { Button, TextField } from "@aymurai/ui";
import { useNavigate } from "@tanstack/react-router";
import { AxiosError } from "axios";
import {
  type ChangeEventHandler,
  type SubmitEventHandler,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { ZodError } from "zod";

export default function ConnectToHost() {
  const navigate = useNavigate();
  const defaultHost = isElectronApp() ? "" : window.location.origin;
  const remoteHost = localStore.useServerHost() ?? defaultHost;
  const { setServerHost } = localStore.useServerHostActions();
  const { t } = useTranslation();

  const [host, setHost] = useState(remoteHost);

  const { mutate: connectToHost, isPending, error, reset } = useConnectToHost();

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setHost(e.target.value);
    reset();
  };

  const tryConnection: SubmitEventHandler = (e) => {
    e.preventDefault();

    connectToHost(host, {
      onSuccess: () => {
        setServerHost(host);
        navigate({
          to: "/home/features",
        });
      },
    });
  };

  const errorMessage = (err: Error | null): string => {
    console.error(err);
    if (err instanceof AxiosError) {
      if (err.code === "ERR_NETWORK") return t("home.host.errors.network");
      return t("home.host.errors.connection");
    }

    if (err instanceof ZodError) {
      return t("home.host.errors.invalidResponse");
    }

    if (err instanceof TypeError) {
      return t("home.host.errors.invalidUrl");
    }

    return t("home.host.errors.unknown");
  };

  return (
    <form onSubmit={tryConnection}>
      <Stack justify="center" gap="3" width="[400px]">
        <h2 className={css({ textStyle: "subtitle.sm.strong" })}>
          {t("home.host.connectServerExplanation")}
        </h2>

        <TextField
          label={t("home.host.connectServerLabel")}
          placeholder="http://"
          value={host}
          onChange={handleChange}
          error={error ? errorMessage(error) : undefined}
        />

        <Button type="submit" isLoading={isPending}>
          {t("home.host.connectServerSubmit")}
        </Button>
      </Stack>
    </form>
  );
}
