import { CheckCircle, Info } from "phosphor-react";

import { colors } from "styles/tokens";
import { styled } from "styles";
import { Button, Stack, Subtitle } from "components";
import { useFiles, useLogin, useUser } from "hooks";
import { submitValidations } from "utils/file";
import { useEffect, useRef, useState } from "react";
import { FunctionType } from "types/user";

const Component = styled("div", {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: "$m",

  width: "100%",
  padding: "$m $l",

  backgroundColor: "$infoSecondary",

  borderRadius: "$xxs",
});

export default function Callout() {
  const [submitted, setSubmitted] = useState<boolean>();
  const user = useUser();
  const files = useFiles();
  const initialFlow = useRef<boolean>(!!user?.online);
  const { login } = useLogin();

  const isOnline = initialFlow.current;

  const props = {
    subtitle: isOnline
      ? "Tus datos se guardaron en tu cuenta de Google ¿Quieres guardarlo en tu local también?"
      : "Tus datos se guardaron en un carpeta en tu local ¿Quieres guardarlo en tu cuenta de Google también?",
    buttonText: isOnline ? "Guardar en local" : "Guardar en Google",
    // If we switched modes, this means we have POSTed the data to the cloud
    buttonDisabled: submitted,
  };

  const handleCreateBackup = async () => {
    if (isOnline) {
      // POST the data in order
      for (let file of files) {
        // We are working in online mode, must write to the filesystem
        await submitValidations({
          isOnline: false,
          token: "",
          validations: file.validationObject,
        });
      }

      setSubmitted(true);
    } else {
      // We are working in local, must upload the data to the cloud
      // This function doesn't immediately POST the data. It updates the user state
      // forcing to run the below effect

      // TODO optimizar esta funcion, añadiendo un callback onLogin. El objetivo de esto es remover
      // el useEffect
      login.online(FunctionType.DATASET);
    }
  };

  useEffect(() => {
    const f = async () => {
      // POST the data in order
      for (let file of files) {
        await submitValidations({
          isOnline: user!.online,
          token: user!.token,
          validations: file.validationObject,
        });
      }

      setSubmitted(true);
    };

    // We changed mode to online, now is the correcto moment to POST the data
    if (user && user.online !== initialFlow.current) {
      f();
    }
  }, [user, files]);

  return (
    <Component>
      <Stack spacing="s" direction="row" align="center" css={{ flex: 1 }}>
        <Info size={24} color={colors.infoPrimary} />
        <Subtitle weight="strong" size="s">
          {props.subtitle}
        </Subtitle>
      </Stack>
      {/* TODO agregar el onClick a este boton */}
      <Button
        size="s"
        variant="secondary"
        onClick={handleCreateBackup}
        disabled={props.buttonDisabled}
      >
        {props.buttonText}
        {submitted && (
          <CheckCircle
            size={16}
            color={colors.textOnButtonDisabled}
            weight="bold"
          />
        )}
      </Button>
    </Component>
  );
}
