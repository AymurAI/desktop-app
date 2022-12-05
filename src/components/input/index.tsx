import { ChangeEventHandler, ReactNode, useState } from 'react';

import { Label, Text } from 'components';
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
}
export default function Input({
  label,
  helper,
  sufix,
  prefix,
  value,
  onChange,
  ...props
}: Props) {
  const [inputValue, setInputValue] = useState(value);

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    onChange?.(e);
  };

  return (
    <Container>
      {label}
      <InputContainer>
        {prefix && (
          <>
            {prefix}
            <Text>|</Text>
          </>
        )}

        <StyledInput
          value={inputValue}
          onChange={handleChange}
          {...props}
        ></StyledInput>

        {sufix && (
          <>
            <Text>|</Text>
            {sufix}
          </>
        )}
      </InputContainer>
      {helper && <Label size="s">{helper}</Label>}
    </Container>
  );
}
