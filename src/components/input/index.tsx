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
  ...props
}: Props) {
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
