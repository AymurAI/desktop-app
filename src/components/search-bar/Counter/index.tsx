import { CaretUp as PreviousIcon, CaretDown as NextIcon } from 'phosphor-react';

import Label from '../../label';
import Stack from '../../stack';
import Button from '../../button';

import type { Props } from './Counter.types';
import * as S from './Counter.styles';

export default function Counter({
  matchesCount,
  next,
  previous,
  count,
}: Props) {
  // Only return the counter if there is a match
  if (matchesCount === 0) return null;

  return (
    <S.Counter>
      <Label css={{ color: '$textDefault' }}>{count}</Label>
      <Label>de {matchesCount}</Label>
      <Stack direction="row" wrap="nowrap" spacing="xxs">
        <Button onClick={previous} variant="none" disabled={count === 1}>
          <PreviousIcon size={24} />
        </Button>
        <Button onClick={next} variant="none" disabled={count === matchesCount}>
          <NextIcon size={24} />
        </Button>
      </Stack>
    </S.Counter>
  );
}
