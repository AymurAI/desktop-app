import { Info } from 'phosphor-react';

import { Stack, Text } from 'components';
import { colors } from 'styles/tokens';

export default function Callout() {
  return (
    <Stack
      align="center"
      wrap="nowrap"
      css={{ width: 300, bg: '$infoSecondary', p: '$m' }}
    >
      <Info weight="regular" size={24} color={colors.infoPrimary} />
      <Stack direction="column">
        <Text size="xs">
          Para ingresar a la plataforma debes utilizar tu cuenta de Google
          habilitada por el juzgado.
        </Text>
        <Text size="xs">No olvides utilizar siempre la misma cuenta.</Text>
      </Stack>
    </Stack>
  );
}
