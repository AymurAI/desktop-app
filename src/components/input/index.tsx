import {
  ChangeEventHandler,
  ReactNode,
  useImperativeHandle,
  useState,
} from 'react';

import { Label, Text, Suggestion } from 'components';
import { NativeComponent } from 'types/component';
import {
  Input as StyledInput,
  Container,
  InputContainer,
} from './Input.styles';
import { forwardRef } from 'react';

interface Props extends NativeComponent<'input', 'prefix' | 'type'> {
  label?: string;
  suggestion?: string;
  helper?: string;
  sufix?: ReactNode;
  prefix?: ReactNode;
  defaultValue?: string;
}
export default forwardRef<{ value: string }, Props>(function Input(
  { label, helper, suggestion, prefix, sufix, defaultValue, ...props },
  ref
) {
  const [value, setValue] = useState<string>(defaultValue ?? '');

  // Only exposes `selected` object to the parent component
  useImperativeHandle(
    ref,
    () => {
      return {
        value,
      };
    },
    [value]
  );

  const isValueEmpty = !value || value === '';

  const handleClickSuggestion = () => setValue(suggestion as string);

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setValue(e.target.value);
  };
  return (
    <Container>
      {/* LABEL */}
      {label}

      {/* INPUT CONTAINER */}
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
          value={value}
          type="text"
          onChange={handleChange}
          {...props}
        />

        {/* SUGGESTION */}
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

      {/* HELPER */}
      {helper && <Label size="s">{helper}</Label>}
    </Container>
  );
});
