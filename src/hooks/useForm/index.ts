import { FormEvent, useRef } from 'react';
import { AllLabels, LabelDecisiones, LabelType } from 'types/aymurai';
import { FormData, FormValue, RegisterFunction, SubmitFunction } from './types';

/**
 * Creates a group of component references and a function to handle
 * @returns `register()` and `submit()` functions
 */
export default function useForm() {
  const refs = useRef<FormData>({});

  /**
   * Adds a reference to a components value to the 'state'
   * @param name Name of the reference
   * @returns A `(ref) => void` function that should be applied to the `ref={...}` prop of a component
   */
  const register: RegisterFunction = (name, decision) => (ref) => {
    if (ref) {
      // We have to alter the DECISIONES array
      if (name in LabelDecisiones) {
        // In case we already have an array, modify the label
        if (refs.current.DECISIONES) {
          const arr = refs.current.DECISIONES;
          const i = decision ?? 0;

          arr[i][name as LabelDecisiones] = ref.value;
        } else {
          // We have no array, create it
          refs.current.DECISIONES = [{ [name]: ref.value }];
        }
      } else {
        // Just modify the label in the object
        refs.current[name as LabelType] = ref.value;
      }
    }
  };

  /**
   * Collects all the data from the referrences and creates a submit function with them
   * @param callback Callback that is called with all the data collected from the references as an argument
   * @returns A `(event) => void` function that should be applied to the `onSubmit={...}` prop of a form
   */
  const submit = (callback: SubmitFunction) => (e: FormEvent) => {
    callback(refs.current);
  };

  const addDecision = () => {
    const arr = refs.current.DECISIONES;
    if (arr) {
      refs.current.DECISIONES = [...arr, {}];
    } else {
      refs.current.DECISIONES = [];
    }
  };

  return { register, submit, addDecision };
}

export * from './types';
