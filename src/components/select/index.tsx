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
  label?: string;
  helper?: string;
}
export default function Select({
  label,
  helper,
}: Props) {

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
      </OptionContainer>
    </Container>
  );
}
