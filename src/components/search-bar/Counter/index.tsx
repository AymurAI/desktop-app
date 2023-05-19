import { CaretUp as PreviousIcon, CaretDown as NextIcon } from 'phosphor-react';

import Label from '../../label';
import Stack from '../../stack';
import Button from '../../button';

import type { Props } from './Counter.types';
import * as S from './Counter.styles';

export default function Counter({
  getMatchCount,
  next,
  previous,
  count,
}: Props) {
  const matchCount = getMatchCount();

  // Only return the counter if there is a match
  if (matchCount === 0) return null;

  return (
    <S.Counter>
      <Label css={{ color: '$textDefault' }}>{count}</Label>
      <Label>de {matchCount}</Label>
      <Stack direction="row" wrap="nowrap" spacing="xxs">
        <Button onClick={previous} variant="none" disabled={count === 1}>
          <PreviousIcon size={24} />
        </Button>
        <Button onClick={next} variant="none" disabled={count === matchCount}>
          <NextIcon size={24} />
        </Button>
      </Stack>
    </S.Counter>
  );
}
