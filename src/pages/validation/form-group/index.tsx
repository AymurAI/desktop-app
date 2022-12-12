import { DocFile } from 'types/file';
import {
  DatosAcusado,
  DatosDenunciante,
  Decision,
  InfoGral,
  InfoHecho,
} from './forms';
import Container from './FormGroup.styles';
import {
  GetCheckedFunction,
  GetSuggestionFunction,
  GetValueFunction,
} from './FormGroup.types';

type Predictions = {
  [key: string]: string;
};
interface Props {
  file: DocFile;
}
export default function FormGroup({ file }: Props) {
  // Format the orediction into a { [string]: string } format
  const predictions: Predictions = (file.predictions ?? []).reduce(
    (prev, { attrs, text }) => ({
      ...prev,
      [attrs.aymurai_label]: text,
    }),
    {}
  );

  // TODO checkear este `as string`
  const getValue: GetValueFunction = (label) =>
    (file.validationObject[label] ?? '') as string;
  const getSuggestion: GetSuggestionFunction = (label) =>
    predictions[label] ?? '';
  const getChecked: GetCheckedFunction = (label) =>
    getSuggestion(label).toLowerCase() === 'si';

  const props = {
    fileName: file.data.name,
    getValue,
    getSuggestion,
    getChecked,
  };

  return (
    <Container>
      <InfoGral {...props} />
      <DatosDenunciante {...props} />
      <DatosAcusado {...props} />
      <InfoHecho {...props} />
      <Decision {...props} />
    </Container>
  );
}
