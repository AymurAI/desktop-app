import { useState, MouseEvent, KeyboardEvent } from 'react';
import { CaretDown } from 'phosphor-react';

import { Label, Suggestion, Text } from 'components';
import {
  Container,
  Input,
  Option,
  OptionContainer,
  TextContainer,
} from './Select.styles';

type SelectOption = { id: string; text: string };
interface Props {
  onChange?: (value: SelectOption | undefined) => void;
  options: SelectOption[];
  label?: string;
  helper?: string;
  selected?: SelectOption['id'];
  suggestion?: SelectOption['id'];
}
export default function Select({
  label,
  helper,
  onChange,
  selected,
  options,
  suggestion,
}: Props) {
  const [selectedId, setSelectedId] = useState<SelectOption['id']>(
    selected ?? ''
  );

  const isValueEmpty = selectedId === '' || selectedId === undefined;

  const handleSelect =
    (id: SelectOption['id']) => (e: MouseEvent<HTMLLIElement>) => {
      e.currentTarget.blur();
      setSelectedId(id);

      onChange?.(options.find((option) => id === option.id));
    };

  const handleKeySelect =
    (id: SelectOption['id']) => (e: KeyboardEvent<HTMLLIElement>) => {
      if (e.code === 'Escape') {
        e.currentTarget.blur();
      } else if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();

        setSelectedId(id);
        e.currentTarget.blur();

        onChange?.(options.find((option) => id === option.id));
      }
    };

  const handleClickSuggestion = () => setSelectedId(suggestion ?? '');

  const selectedOption = options.find(({ id }) => selectedId === id);
  const suggestedOption = options.find(({ id }) => suggestion === id)?.text;

  return (
    <Container>
      {/* READONLY 'INPUT' */}
      <TextContainer>
        {label && (
          <Label size="s" css={{ color: '$textDefault' }}>
            {label}
          </Label>
        )}

        <Input tabIndex={0}>
          <Text>{selectedOption?.text ?? ''}</Text>
          {suggestion && isValueEmpty && (
            <Suggestion onClick={handleClickSuggestion}>
              {suggestedOption}
            </Suggestion>
          )}
          <CaretDown size={16} />
        </Input>

        {helper && <Label size="s">{helper}</Label>}
      </TextContainer>

      {/* OPTION LIST */}
      <OptionContainer>
        {options.map(({ id, text }) => (
          <Option
            onClick={handleSelect(id)}
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
