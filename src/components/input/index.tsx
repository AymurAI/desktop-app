import {
  ChangeEventHandler,
  KeyboardEvent,
  MouseEvent,
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

export type InputRefValue = { value: string };
interface Props
  extends NativeComponent<'input', 'prefix' | 'type' | 'value' | 'onChange'> {
  label?: string;
  suggestion?: string;
  helper?: string;
  sufix?: ReactNode;
  prefix?: ReactNode;
  defaultValue?: string;
  onChange?: (value: string) => void;
}
export default forwardRef<{ value: string }, Props>(function Input(
  {
    label,
    helper,
    suggestion,
    prefix,
    sufix,
    defaultValue,
    onChange,
    ...props
  },
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

  const updateValue = (newValue: string) => {
    setValue(newValue);

    onChange?.(newValue);
  };

  const handleClickSuggestion = (e: MouseEvent) => {
    updateValue(suggestion as string); // We are sure is a string because the button is enabled only in case suggestion = string
  };
  const handleKeySuggestion = (e: KeyboardEvent) => {
    e.preventDefault();

    if (e.code === 'Space' || e.code === 'Enter')
      updateValue(suggestion as string); // We are sure is a string because the button is enabled only in case suggestion = string
  };

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    updateValue(e.target.value);
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
            <Label>{prefix}</Label>
            <Text css={{ lineHeight: '100%', color: '$secondary' }}>|</Text>
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
            <Suggestion
              onClick={handleClickSuggestion}
              onKeyDown={handleKeySuggestion}
              tabIndex={0}
            >
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
