import { useRunLocalServer } from "@/services/aymurai";
import { css } from "@/styled/css";
import { Stack, styled } from "@/styled/jsx";
import { Button } from "@aymurai/ui";
import { useNavigate } from "@tanstack/react-router";
import { HardDrives, Monitor } from "phosphor-react";
import { useTranslation } from "react-i18next";

interface ChooseHostProps {
  onRemoteClick: () => void;
}
export default function ChooseHost({ onRemoteClick }: ChooseHostProps) {
  const navigate = useNavigate();
  const { run: runLocalServer, isRunning } = useRunLocalServer({
    onSuccess: () =>
      navigate({
        to: "/home/features",
      }),
  });

  const { t } = useTranslation();

  return (
    // maxWidth 400px, the base/xl logo widths (100px/180px) and the base gap
    // (1rem) are arbitrary RSP-11 sizing choices with no matching preset
    // token; kept as raw escapes (RSP-12a).
    <Stack
      align="center"
      gap={{ base: "[1rem]", xl: "12" }}
      width="full"
      maxWidth="[400px]"
    >
      <styled.img
        src={`${import.meta.env.BASE_URL}brand/aymurai-vert-darkpurple.svg`}
        alt="Logotipo AymurAI"
        width={{ base: "[100px]", xl: "[180px]" }}
      />
      <Stack
        as="fieldset"
        aria-labelledby="connect-heading"
        align="stretch"
        gap="4"
        width="full"
      >
        <h2
          id="connect-heading"
          className={css({
            textStyle: "subtitle.sm.strong",
            textAlign: "center",
          })}
        >
          {t("home.host.howToConnect")}
        </h2>
        <Stack gap="2" align="stretch" textAlign="center">
          <Button
            onClick={runLocalServer}
            disabled={isRunning}
            isLoading={isRunning}
          >
            <Monitor weight="bold" />
            {t("home.host.optionLocal")}
          </Button>
          <p className={css({ textStyle: "subtitle.sm.default" })}>
            {t("home.host.optionOr")}
          </p>
          <Button onClick={onRemoteClick}>
            <HardDrives weight="bold" />
            {t("home.host.optionServer")}
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
}
