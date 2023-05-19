import type { Props } from './Counter.types';
import * as S from './Counter.styles';

export default function Counter({
  getMatchCount,
}: Props) {
  const matchCount = getMatchCount();

  // Only return the counter if there is a match
  if (matchCount === 0) return null;

}
