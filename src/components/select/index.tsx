import {
  useState,
  MouseEvent,
  KeyboardEvent,
  forwardRef,
  useImperativeHandle,
  ChangeEvent,
} from 'react';
import { CaretDown } from 'phosphor-react';

import { Label, Suggestion, Text } from 'components';
import {
  Container,
  Input,
  InputContainer,
  Option,
  OptionContainer,
  TextContainer,
} from './Select.styles';
import { findOption } from './utils';

export type SelectOption = { id: string; text: string };
interface Props {
  options: SelectOption[];
  label?: string;
  helper?: string;
  selected?: SelectOption['id'];
  suggestion?: SelectOption['text'];
}
export default forwardRef<{ selected: SelectOption | undefined }, Props>(
  function Select({ label, helper, options, suggestion, selected }, ref) {
    const [value, setValue] = useState<SelectOption['text']>(
      findOption(selected, options)?.text ?? ''
    );

    // Only exposes `selected` object to the parent component
    useImperativeHandle(
      ref,
      () => {
        return {
          selected: findOption(value, options),
        };
      },
      [value, options]
    );

    const isValueEmpty = !value || value === '';

    const handleClickSelect =
      (text: string) => (e: MouseEvent<HTMLLIElement>) => {
        setValue(text);
        e.currentTarget.blur();
      };

    const handleKeySelect =
      (text: string) => (e: KeyboardEvent<HTMLLIElement>) => {
        if (e.code === 'Escape') {
          e.currentTarget.blur();
        } else if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault(); // Prevent scroll

          setValue(text);
          e.currentTarget.blur();
        }
      };

    const handleChangeInput = (e: ChangeEvent<HTMLInputElement>) => {
      setValue(e.currentTarget.value);
    };

    return (
      <Container>
        <TextContainer>
          {/* LABEL */}
          {label && (
            <Label size="s" css={{ color: '$textDefault' }}>
              {label}
            </Label>
          )}

          {/* INPUT */}
          <InputContainer>
            <Input value={value} onChange={handleChangeInput} />
            {suggestion && isValueEmpty && (
              <>
                <Text css={{ lineHeight: '100%' }}>|</Text>
                <Suggestion
                  onClick={handleClickSelect(suggestion)}
                  onKeyDown={handleKeySelect(suggestion)}
                  tabIndex={0}
                >
                  {suggestion}
                </Suggestion>
              </>
            )}
            <CaretDown size={16} />
          </InputContainer>

          {/* HELPER */}
          {helper && <Label size="s">{helper}</Label>}
        </TextContainer>

        {/* OPTION LIST */}
        <OptionContainer>
          {options.map(({ id, text }) => (
            <Option
              onClick={handleClickSelect(text)}
              onKeyDown={handleKeySelect(text)}
              key={id}
              tabIndex={0}
            >
              {text}
            </Option>
          ))}
        </OptionContainer>
      </Container>
    );
  }
);
