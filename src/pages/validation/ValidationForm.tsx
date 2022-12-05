import { styled } from 'styles';
import { DocFile } from 'types/file';
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

  const predictions: Predictions = (file.predictions ?? []).reduce(
    (prev, { attrs, text }) => ({
      ...prev,
      [attrs.aymurai_label]: text,
    }),
    {}
  );

  const getPrediction = (label: string) => {
    return predictions[label] ?? '';
  };

  return (
    <Form>
    </Form>
  );
}
