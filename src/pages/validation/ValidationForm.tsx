import { styled } from 'styles';
const Form = styled('form', {
  display: 'flex',
  flexDirection: 'column',
  gap: 64,
});

type Predictions = {
  [key: string]: string;
};

interface Props {
  file: DocFile;
}
export default function ValidationForm({ file }: Props) {
  return (
    <Form>
    </Form>
  );
}
