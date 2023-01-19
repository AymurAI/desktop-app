import {
  useState,
  MouseEvent,
  KeyboardEvent,
  forwardRef,
  useImperativeHandle,
  ChangeEvent,
} from 'react';
import { CaretDown } from 'phosphor-react';

import { Label, Suggestion as SuggestionComponent, Text } from 'components';
import {
  Container,
  Input,
  InputContainer,
  Option,
  OptionContainer,
  TextContainer,
} from './Select.styles';
import { findById, orderByPriority, secureSuggestion } from './utils';
import { Optional } from 'types/utils';

export type SelectOption = { id: string; text: string };
export type Suggestion = Optional<SelectOption, 'text'>;
interface Props {
  options: SelectOption[];
  label?: string;
  helper?: string;
  selected?: SelectOption['id'];
  suggestion?: Suggestion;
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
      findById(selected, options)?.id ?? ''
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

    const securedSuggestion = secureSuggestion(suggestion, options);
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
            {securedSuggestion && isValueEmpty && (
              <>
                <Text css={{ lineHeight: '100%' }}>|</Text>
                <SuggestionComponent
                  onClick={handleClickSelect(securedSuggestion.id)}
                  onKeyDown={handleKeySelect(securedSuggestion.id)}
                  tabIndex={0}
                >
                  {securedSuggestion.text}
                </SuggestionComponent>
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
