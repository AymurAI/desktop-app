import { FormEvent } from 'react';

type GenericRef<T> = { value: T };
export type InputRefValue = GenericRef<string>;
export type SelectRefValue = GenericRef<
  { id: string; text: string } | undefined
>;
export type RadioRefValue = GenericRef<boolean>;
export type CheckboxRefValue = GenericRef<boolean>;

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
