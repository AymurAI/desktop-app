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
import { findById, orderByPriority } from './utils';

export type SelectOption = { id: string; text: string };
interface Props {
  options: SelectOption[];
  label?: string;
  helper?: string;
  selected?: SelectOption['id'];
  suggestion?: SelectOption;
  onChange?: (value: SelectOption | undefined) => void;
  priorityOrder?: SelectOption['id'][];
}
export default forwardRef<{ value: SelectOption['id'] | undefined }, Props>(
  function Select(
    {
      label,
      helper,
      options,
      suggestion,
      selected,
      onChange,
      priorityOrder = [],
    },
    ref
  ) {
    const [id, setId] = useState<SelectOption['id']>(
      findById(selected, options)?.text ?? ''
    );

    // Only exposes `selected` object to the parent component
    useImperativeHandle(
      ref,
      () => {
        return {
          value: id,
        };
      },
      [id]
    );

    const isValueEmpty = !id || id === '';
    const orderedOptions = orderByPriority(options, priorityOrder);

    const option = findById(id, options);

    const updateValue = (newId: SelectOption['id']) => {
      setId(newId);

      const option = findById(newId, options);
      onChange?.(option);
    };

    const handleClickSelect =
      (text: string) => (e: MouseEvent<HTMLLIElement>) => {
        e.stopPropagation();
        updateValue(text);
        e.currentTarget.blur();
      };

    const handleKeySelect =
      (text: string) => (e: KeyboardEvent<HTMLLIElement>) => {
        if (e.code === 'Escape') {
          e.currentTarget.blur();
        } else if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault(); // Prevent scroll

          updateValue(text);
          e.currentTarget.blur();
        }
      };

    const handleChangeInput = (e: ChangeEvent<HTMLInputElement>) => {
      updateValue(e.currentTarget.value);
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
          <InputContainer tabIndex={-1}>
            <Input value={option?.text} onChange={handleChangeInput} />
            {suggestion && isValueEmpty && (
              <>
                <Text css={{ lineHeight: '100%' }}>|</Text>
                <Suggestion
                  onClick={handleClickSelect(suggestion.id)}
                  onKeyDown={handleKeySelect(suggestion.id)}
                  tabIndex={0}
                >
                  {suggestion.text}
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
          {orderedOptions.map(({ id, text }) => (
            <Option
              onClick={handleClickSelect(id)}
              onKeyDown={handleKeySelect(id)}
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
