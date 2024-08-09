import { FormEventHandler } from 'react';

import { FormValue, RegisterFunction } from 'hooks/useForm';
import { LabelDecisiones } from 'types/aymurai';
import Suggester from 'utils/predictions/suggestions';

export interface FormProps {
  decision?: number;
  register: RegisterFunction;
  onSubmit: FormEventHandler;
  onCheck: (checked: boolean) => void;
  suggester: Suggester;
}

export interface FormDecisionProps extends FormProps {
  getDecisionValue: (n: number) => (field: LabelDecisiones) => FormValue;
}
