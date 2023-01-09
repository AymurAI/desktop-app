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

type Predictions = {
  [key: string]: string;
};
interface Props {
  file: DocFile;
}
export default function FormGroup({ file }: Props) {
  const [decision, setDecision] = useState(0);
  const [decisionAmount, setDecisionAmount] = useState(1);
  const { register, submit, addDecision } = useForm();
  const dispatch = useFileDispatch();

  // Format the orediction into a { [string]: string } format
  const predictions: Predictions = (file.predictions ?? []).reduce(
    (prev, { attrs, text }) => ({
      ...prev,
      [attrs.aymurai_label]: text,
    }),
    {}
  );

  const createDecision = () => {
    addDecision();
    setDecisionAmount(decisionAmount + 1);
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
    fileName: file.data.name,
    getSuggestion,
    getChecked,
    register,
    onSubmit: handleSubmit,
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
