import {
  Container,
  Input,
  Option,
  OptionContainer,
  TextContainer,
} from './Select.styles';

type SelectOption = { id: string; text: string };
interface Props {
}
export default function Select({
}: Props) {

  return (
    <Container>
      {/* READONLY 'INPUT' */}
      <TextContainer>
      </TextContainer>

      {/* OPTION LIST */}
      <OptionContainer>
      </OptionContainer>
    </Container>
  );
}
