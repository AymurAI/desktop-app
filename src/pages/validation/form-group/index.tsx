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
import { DecisionTabs } from 'components';
import { useFileDispatch, useForm } from 'hooks';
import { appendValidation } from 'reducers/file/actions';
import { countDecisiones, Suggester } from 'utils/predictions';

interface Props {
  file: DocFile;
}
export default function FormGroup({ file }: Props) {
  const [decision, setDecision] = useState(0);
  const { register, submit, addDecision, decisionAmount } = useForm(
    countDecisiones(file.predictions)
  );
  const dispatch = useFileDispatch();

  const createDecision = () => {
    addDecision();
  };
  const selectDecision = (n: number) => setDecision(n);

  const handleSubmit = submit((data) => {
    dispatch(appendValidation(file.data.name, data));
  });

  const props = {
    register,
    onSubmit: handleSubmit,
    suggester: new Suggester(file.predictions),
  };

  return (
    <Container>
      <InfoGral {...props} />

      <DecisionTabs
        selected={decision}
        addDecision={createDecision}
        {...{ decisionAmount, selectDecision }}
      />
      <Container key={decision}>
        <InfoHecho {...props} decision={decision} />
        <Decision {...props} decision={decision} />
      </Container>

      <DatosDenunciante {...props} />
      <DatosAcusado {...props} />
    </Container>
  );
}
