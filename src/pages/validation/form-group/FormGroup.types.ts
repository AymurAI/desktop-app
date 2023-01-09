import { RegisterFunction } from 'hooks/useForm';
import { FormEventHandler } from 'react';
import { AllLabels } from 'types/aymurai';

export type GetSuggestionFunction = (label: AllLabels) => string;
export type GetCheckedFunction = (label: AllLabels) => boolean;

export interface FormProps {
  getSuggestion: GetSuggestionFunction;
  getChecked: GetCheckedFunction;
  decision?: number;
  register: RegisterFunction;
  onSubmit: FormEventHandler;
}
