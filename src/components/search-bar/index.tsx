import { MagnifyingGlass } from 'phosphor-react';

import * as S from './SearchBar.styles';
import type { Props } from './SearchBar.types';

export default function SearchBar({}: Props) {
  return (
    <S.Wrapper>
      <MagnifyingGlass size={24} />
      <S.Input placeholder="Buscar" type="text" />
    </S.Wrapper>
  );
}
