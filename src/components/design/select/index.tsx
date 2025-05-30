import { CaretDown } from "phosphor-react";
import type React from "react";
import { type ChangeEventHandler, type SyntheticEvent, useRef } from "react";

import { Label, Suggestion, Text } from "components";

import { List } from "./List";
import * as S from "./Select.styles";
import { filterOptions } from "./utils/filtering";

export interface SelectOption {
  label: string;
  value: string;
}
interface SelectSuggestion extends SelectOption {}

interface SelectProps
  extends Omit<React.HTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  options: SelectOption[];
  value: string;
  suggestion?: SelectSuggestion;

  label?: string;
  placeholder?: string;
  helper?: string;

  onChange: (value: string) => void;
}

export default function Select({
  options,
  value,
  id,
  label,
  suggestion,
  onChange,
  helper,
  ...props
}: SelectProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = filterOptions(options, value);

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const value = e.target.value;

    onChange?.(value);
  };

  const handleOptionSelect = (value: SelectOption["value"]) => {
    if (!inputRef.current) return;

    inputRef.current.blur();
    onChange?.(value);
  };

  const handleSuggestionSelect = (e: SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!suggestion || !inputRef.current) return;

    onChange?.(suggestion.value);
  };

  return (
    <S.Container>
      <S.TextContainer>
        {label && (
          <Label htmlFor={id} size="s" css={{ color: "$textDefault" }}>
            {label}
          </Label>
        )}

        <S.InputContainer tabIndex={-1}>
          <S.Input
            id={id}
            value={value}
            ref={inputRef}
            onChange={handleChange}
            {...props}
          />

          {suggestion && !value && (
            <>
              <Text css={{ lineHeight: "100%" }}>|</Text>
              <Suggestion
                onClick={handleSuggestionSelect}
                onKeyDown={handleSuggestionSelect}
                tabIndex={0}
              >
                {suggestion.label}
              </Suggestion>
            </>
          )}
          <CaretDown size={16} />
        </S.InputContainer>

        {helper && <Label size="s">{helper}</Label>}
      </S.TextContainer>

      <List
        options={filteredOptions}
        onClick={handleOptionSelect}
        onKeyDown={handleOptionSelect}
      />
    </S.Container>
  );
}
