import { FormEvent } from 'react';
import { AllLabels, LabelDecisiones, LabelType } from 'types/aymurai';

/**
 * Any value the form can take
 */
export type FormValue = string | boolean | undefined;
/**
 * Data structure of the whole form
 */
export type FormData = Partial<
  Record<LabelType, FormValue> & {
    DECISIONES: Partial<Record<LabelDecisiones, FormValue>>[];
  }
>;
/**
 * Flat form of the `FormData` structure
 */
export type FlatFormData = Partial<Record<AllLabels, FormValue>>;

/**
 * Type of the reference for any componente
 */
export type ComponentRef = { value: string | boolean | undefined } | null;

export type RegisterFunction = (name: AllLabels) => (ref: ComponentRef) => void;
export type SubmitFunction = (data: FormData, e: FormEvent) => void;


export type ComponentRef =
  | InputRefValue
  | SelectRefValue
  | RadioRefValue
  | CheckboxRefValue
  | null;

export type FormData = {
  [key: string]: string | boolean | undefined;
};

export type SubmitFunction = (data: FormData, e: FormEvent) => void;
export type RegisterFunction = (name: string) => (ref: ComponentRef) => void;
