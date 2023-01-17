import { useState } from 'react';

import { DocFile } from 'types/file';
import {
  InfoGral,
  DatosDenunciante,
  DatosAcusado,
  InfoHecho,
  Decision,
} from './forms';
import Container from './FormGroup.styles';
import { GetCheckedFunction, GetSuggestionFunction } from './FormGroup.types';
import { DecisionTabs } from 'components';
import { useFileDispatch, useForm } from 'hooks';
import { appendValidation } from 'reducers/file/actions';
import { countDecisiones } from 'utils/predictions';

type Predictions<T extends string | string[]> = {
  [key: string]: T;
};
interface Props {
  file: DocFile;
}
export default function FormGroup({ file }: Props) {
  const [decision, setDecision] = useState(0);
  const { register, submit, addDecision, decisionAmount } = useForm(
    countDecisiones(file.predictions)
  );
  const dispatch = useFileDispatch();

  // Format the orediction into a { [string]: string } format
  const predictions: Predictions<string> = (file.predictions ?? []).reduce(
    (prev, { attrs, text }) => ({
      ...prev,
      [attrs.aymurai_label]: text,
    }),
    {}
  );

  const createDecision = () => {
    addDecision();
  };
  const selectDecision = (n: number) => setDecision(n);

  const handleSubmit = submit((data) => {
    dispatch(appendValidation(file.data.name, data));
  });

  const getSuggestion: GetSuggestionFunction = (label) =>
    predictions[label] ?? '';
  const getChecked: GetCheckedFunction = (label) =>
    getSuggestion(label).toLowerCase() === 'si';

  const props = {
    getSuggestion,
    getChecked,
    register,
    onSubmit: handleSubmit,
    predictions: file.predictions,
  };

  return (
    <Container>
      <InfoGral {...props} />
      <DatosDenunciante {...props} />
      <DatosAcusado {...props} />

      <DecisionTabs
        selected={decision}
        addDecision={createDecision}
        {...{ decisionAmount, selectDecision }}
      />
      <Container key={decision}>
        <InfoHecho {...props} decision={decision} />
        <Decision {...props} decision={decision} />
      </Container>
    </Container>
  );
}
