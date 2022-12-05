import { ChangeEventHandler, ReactNode, useState } from 'react';

import { Label, Text, Suggestion } from 'components';
import { NativeComponent } from 'types/component';
import {
  Input as StyledInput,
  Container,
  InputContainer,
} from './Input.styles';

interface Props extends NativeComponent<'input', 'prefix'> {
  label?: string;
  suggestion?: string;
  helper?: string;
  sufix?: ReactNode;
  prefix?: ReactNode;
  onChange?: ChangeEventHandler<HTMLInputElement>;
}
export default function Input({
  label,
  helper,
  sufix,
  prefix,
  value,
  suggestion,
  onChange,
  ...props
}: Props) {
  const [inputValue, setInputValue] = useState(value);

  const isValueEmpty = inputValue === '' || inputValue === undefined;

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    onChange?.(e);
  };

  const handleClickSuggestion = () => setInputValue(suggestion);

  return (
    <Container>
      {label}
      <InputContainer>
        {/* PREFIX */}
        {prefix && (
          <>
            {prefix}
            <Text css={{ lineHeight: '100%' }}>|</Text>
          </>
        )}

        {/* INPUT */}
        <StyledInput
          value={inputValue}
          onChange={handleChange}
          {...props}
        ></StyledInput>

        {suggestion && isValueEmpty && (
          <>
            <Text css={{ lineHeight: '100%' }}>|</Text>
            <Suggestion onClick={handleClickSuggestion}>
              {suggestion}
            </Suggestion>
          </>
        )}

        {/* SUFIX */}
        {sufix}
      </InputContainer>
      {helper && <Label size="s">{helper}</Label>}
    </Container>
  );
}
