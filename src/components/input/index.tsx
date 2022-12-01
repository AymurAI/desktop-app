import { NativeComponent } from 'types/component';
import { Input as StyledInput, Container } from './Input.styles';

interface Props extends NativeComponent<'input'> {
  label?: string;
  suggestion?: string;
}
export default function Input({ label, placeholder, ...props }: Props) {
  return (
    <Container>
      {label}
      <StyledInput {...props}></StyledInput>
    </Container>
  );
}
