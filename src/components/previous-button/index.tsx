import { MouseEventHandler, ReactNode } from 'react';

import { Arrow, Button, Stack, Title } from 'components';

interface Props {
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

export default function PreviousButton({ children, onClick }: Props) {
  return (
    <Title>
      <Stack>
        <Button
          variant="none"
          size="s"
          css={{ p: 0, alignSelf: 'center' }}
          onClick={onClick}
        >
          <Arrow.Left></Arrow.Left>
        </Button>
        {children}
      </Stack>
    </Title>
  );
}
