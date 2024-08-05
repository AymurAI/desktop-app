import { ChangeEvent, useRef, useState } from "react";

import { Grid } from "components";
import Select, { SelectOption } from "components/select";
import Container from "pages/validation/dataset/form-group/FormGroup.styles";
import { anonymizerLabels } from "types/aymurai";

import { MagnifyingGlass } from "phosphor-react";
import { Counter } from "./Counter";
import * as S from "./SearchBar.styles";
import { useScroll } from "./useScroll";

interface Props {
  isAnnotable?: boolean;
  onSelectChange?: (object: SelectOption | undefined) => void;
  onChange?: (value: string) => void;
}

export const SearchBar = ({
  isAnnotable = false,
  onChange,
  onSelectChange,
}: Props) => {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { next, previous, count, matchesCount } = useScroll(search);

  const changeHandler = (e: ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setSearch(text);
    onChange?.(e.target.value);
  };

  const clickHandler = () => {
    if (inputRef.current) {
      inputRef.current.select();
    }
  };

  const focus = () => inputRef.current?.focus();

  return (
    <Grid
      columns={isAnnotable ? 2 : 1}
      spacing="m"
      justify="stretch"
      align="stretch"
    >
      <S.Wrapper onClick={focus}>
        <MagnifyingGlass size={24} />
        <S.InputContainer>
          <S.Input
            ref={inputRef}
            placeholder="Buscar"
            onChange={changeHandler}
            onClick={clickHandler}
          ></S.Input>
        </S.InputContainer>

        <Counter {...{ next, previous, matchesCount, count }} />
      </S.Wrapper>

      {isAnnotable && (
        <Container>
          <Select options={anonymizerLabels} onChange={onSelectChange} />
        </Container>
      )}
    </Grid>
  );
};
