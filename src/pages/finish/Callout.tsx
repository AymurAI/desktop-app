import { Info } from 'phosphor-react';

import { colors } from 'styles/tokens';
import { styled } from 'styles';
import { Button, Stack, Subtitle } from 'components';
import { useUser } from 'hooks';

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
  const user = useUser();

  const props = {
    subtitle: user?.online
      ? 'Tus datos se guardaron en tu cuenta de Google ¿Quieres guardarlo en tu local también?'
      : 'Tus datos se guardaron en un carpeta en tu local ¿Quieres guardarlo en tu cuenta de Google también?',
    buttonText: user?.online ? 'Guardar en local' : 'Guardar en Google',
  };

  return (
    <Component>
      <Stack spacing="s" direction="row" align="center" css={{ flex: 1 }}>
        <Info size={24} color={colors.infoPrimary} />
        <Subtitle weight="strong" size="s">
          {props.subtitle}
        </Subtitle>
      </Stack>
      <Button size="s" variant="secondary">
        {props.buttonText}
      </Button>
    </Component>
  );
}
