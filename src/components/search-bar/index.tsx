import { useState } from 'react';
import {
  MagnifyingGlass,
  CaretUp as Previous,
  CaretDown as Next,
} from 'phosphor-react';

import Button from '../button';
import Stack from '../stack';
import Label from '../label';

import * as S from './SearchBar.styles';
import type { Props } from './SearchBar.types';

export default function SearchBar({ onChange, html, word }: Props) {
  const [match, setMatch] = useState(1);

  const getCount = () => {
    if (word.length <= 2) return 0;
    else return html.match(new RegExp(word, 'ig'))?.length || 0;
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    onChange(value);
  };

  const scrollToComponent = (n: number) => {
    const components = document.querySelectorAll('mark.searched-word');

    if (components.length === 0 || !components[n - 1]) return;
    console.log(components);
    components[n - 1].scrollIntoView({ behavior: 'smooth' });
  };

  const next = () => {
    if (match === 1) return;

    setMatch((prev) => {
      scrollToComponent(prev - 1);
      return prev - 1;
    });
  };
  const previous = () => {
    if (match === getCount()) return;
    setMatch((prev) => {
      scrollToComponent(prev + 1);
      return prev + 1;
    });
  };

  return (
    <S.Wrapper>
      <MagnifyingGlass size={24} />
      <S.Input onChange={handleChange} placeholder="Buscar" type="text" />
      {getCount() !== 0 && (
        <S.Counter>
          <Label css={{ color: '$textDefault' }}>{match}</Label>
          <Label>de {getCount()}</Label>
          {/* <p>
             
          </p> */}
          <Stack direction="row" wrap="nowrap" spacing="xxs">
            <Button onClick={next} variant="none" disabled={match === 1}>
              <Previous size={24} />
            </Button>
            <Button
              onClick={previous}
              variant="none"
              disabled={match === getCount()}
            >
              <Next size={24} />
            </Button>
          </Stack>
        </S.Counter>
      )}
    </S.Wrapper>
  );
}
