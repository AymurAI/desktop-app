import {
  type ChangeEventHandler,
  type KeyboardEventHandler,
  type MouseEventHandler,
  useRef,
} from "react";

import { Label, Suggestion, Text } from "components";
import type { CSS } from "styles";

import * as S from "./Input.styles";

interface InputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "prefix" | "type" | "onChange" | "value"
  > {
  value: string;
  label?: string;
  helper?: string;
  suggestion?: {
    value: string;
    label: string;
  };
  type?: "text" | "number";
  css?: CSS;

  prefix?: React.ReactNode;
  suffix?: React.ReactNode;

  onChange: (value: string) => void;
}

export default function Input({
  label,
  helper,
  suggestion,
  css,
  prefix,
  suffix,
  value,
  type = "text",
  onChange,
  ...props
}: InputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isValueEmpty = !value || value === "";

  const isValid = (value: string): boolean =>
    Boolean(type === "number" ? !value || value.match(/^\d*$/) : true);

  const applySuggestion = (suggestion: InputProps["suggestion"]) => {
    if (!suggestion || !inputRef.current) return;

    if (!isValid(suggestion.value)) {
      console.error(
        "Invalid suggestion. Tried to apply a 'string' to a 'number' input",
      );
      return;
    }

    onChange?.(suggestion.value);
  };

  const handleSuggestionClick: MouseEventHandler = () => {
    applySuggestion(suggestion);
  };
  const handleSuggestionKeyDown: KeyboardEventHandler = (e) => {
    e.preventDefault();

    if (e.code === "Space" || e.code === "Enter") {
      applySuggestion(suggestion);
    }
  };

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const value = e.target.value;
    if (!isValid(value)) return;

    onChange?.(value);
  };

  return (
    <S.Container>
      {label && <label htmlFor={props.id}>{label}</label>}

      <S.InputContainer>
        {prefix && (
          <>
            <S.Prefix as="span">{prefix}</S.Prefix>
            <Text css={{ lineHeight: "100%", color: "$secondary" }}>|</Text>
          </>
        )}

        <S.Input
          type="text"
          value={value}
          css={css}
          ref={inputRef}
          onChange={handleChange}
          {...props}
        />

        {suggestion && isValueEmpty && (
          <>
            <Text css={{ lineHeight: "100%", color: "$secondary" }}>|</Text>
            <Suggestion
              onClick={handleSuggestionClick}
              onKeyDown={handleSuggestionKeyDown}
              tabIndex={0}
            >
              {suggestion.label}
            </Suggestion>
          </>
        )}

        {suffix}
      </S.InputContainer>

      {helper && (
        <Label as="span" size="s">
          {helper}
        </Label>
      )}
    </S.Container>
  );
}
