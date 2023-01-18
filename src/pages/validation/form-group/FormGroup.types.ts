import { RegisterFunction } from 'hooks/useForm';
import { FormEventHandler } from 'react';
import Suggester from 'utils/predictions/suggestions';

export interface FormProps {
  decision?: number;
  register: RegisterFunction;
  onSubmit: FormEventHandler;
  suggester: Suggester;
}
