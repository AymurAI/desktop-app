import { useRef, useState } from "react";
import { MagnifyingGlass } from "phosphor-react";

import Text from "../text";
import regex from "utils/regex";

import * as S from "./SearchBar.styles";
import type { Props } from "./SearchBar.types";
import useScroll from "./useScroll";
import Counter from "./Counter";
import { getFirstPrediction } from "./utils";
import { Grid, Select } from "components";
import { anonymizerLabels } from "types/aymurai";
import Container from "pages/validation/form-group/FormGroup.styles";

const INITIAL_VALUE = 1;

export default function SearchBar({
  onChange,
  onSelectChange,
  html,
  word,
}: Props) {
  const [count, setCount] = useState(INITIAL_VALUE);
  useScroll(count);
  const inputRef = useRef<HTMLInputElement>(null);

  const isSearching = word.length > 2;
  const firstPrediction = getFirstPrediction(isSearching, word, html);

  const next = () => {
    if (count === getMatchCount()) return;
    setCount((prev) => prev + 1);
  };

  const previous = () => {
    if (count === 1) return;
    setCount((prev) => prev - 1);
  };

  const reset = () => setCount(INITIAL_VALUE);

  const getMatchCount = () => {
    if (!isSearching) return 0;
    else return html.match(regex.includes(word))?.length || 0;
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;

    reset();
    onChange(value);
  };

  const focus = () => {
    inputRef.current?.focus();
  };

  const selectWord = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (firstPrediction && inputRef.current) {
      reset();
      onChange(firstPrediction);
      inputRef.current.value = firstPrediction;
    }
  };

  //Select functions

  return (
    <>
      <Grid columns={2} spacing="none" justify="stretch" align="stretch">
        <S.Wrapper onClick={focus}>
          <MagnifyingGlass size={24} />
          <S.InputContainer>
            <S.Input
              ref={inputRef}
              onChange={handleChange}
              placeholder="Buscar"
              type="text"
            />
            {isSearching && firstPrediction && (
              <S.SuggestionContainer>
                <Text css={{ lineHeight: "100%" }}>|</Text>
                <S.InputSuggestion onClick={selectWord}>
                  {firstPrediction}
                </S.InputSuggestion>
              </S.SuggestionContainer>
            )}
          </S.InputContainer>

          <Counter {...{ next, previous, getMatchCount, count }} />
        </S.Wrapper>

        <Container css={{ "margin-left": "10px" }}>
          <Select options={anonymizerLabels} onChange={onSelectChange} />
        </Container>
      </Grid>
    </>
  );
}
