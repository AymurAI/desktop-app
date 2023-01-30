import { CheckCircle, Info } from 'phosphor-react';

import { colors } from 'styles/tokens';
import { styled } from 'styles';
import { Button, Stack, Subtitle } from 'components';
import { useFiles, useLogin, useUser } from 'hooks';
import { submitValidations } from 'utils/file';
import { useEffect, useRef, useState } from 'react';

const Component = styled('div', {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$m',

  width: '100%',
  padding: '$m $l',

  backgroundColor: '$infoSecondary',

  borderRadius: '$xxs',
});

export default function Callout() {
  const [submitted, setSubmitted] = useState<boolean>();
  const user = useUser();
  const files = useFiles();
  const initialFlow = useRef<boolean>(!!user?.online);
  const { login } = useLogin();

  useEffect(() => {
    // We changed modes, now is the moment to POST the data
    if (user && user.online !== initialFlow.current) {
      submitValidations({
        isOnline: user.online,
        token: user.token,
        validations: files.map((v) => v.validationObject),
      }).then(() => setSubmitted(true));
    }
  }, [user, files]);

  const isOnline = initialFlow.current;

  const props = {
    subtitle: isOnline
      ? 'Tus datos se guardaron en tu cuenta de Google ¿Quieres guardarlo en tu local también?'
      : 'Tus datos se guardaron en un carpeta en tu local ¿Quieres guardarlo en tu cuenta de Google también?',
    buttonText: isOnline ? 'Guardar en local' : 'Guardar en Google',
    // If we switched modes, this means we have POSTed the data to the cloud
    buttonDisabled: submitted,
  };

  const handleCreateBackup = async () => {
    if (isOnline) {
      // We are working in online mode, must write to the filesystem
      await submitValidations({
        isOnline: false,
        token: '',
        validations: files.map((v) => v.validationObject),
      });

      setSubmitted(true);
    } else {
      // We are working in local, must upload the data to the cloud
      login.online();
    }
  };

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
          <CheckCircle size={18} color={colors.textOnButtonDisabled} />
        )}
      </Button>
    </Component>
  );
}
