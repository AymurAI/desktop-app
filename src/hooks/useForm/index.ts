import { FormEvent, useRef } from 'react';
import { FormData, RegisterFunction, SubmitFunction } from './types';
import { isSelect } from './utils';

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
  const register: RegisterFunction = (name) => (ref) => {
    if (isSelect(ref)) {
      refs.current[name] = ref.value?.id;
    } else {
      refs.current[name] = ref?.value;
    }
  };

  /**
   * Collects all the data from the referrences and creates a submit function with them
   * @param callback Callback that is called with all the data collected from the references as an argument
   * @returns A `(event) => void` function that should be applied to the `onSubmit={...}` prop of a form
   */
  const submit = (callback: SubmitFunction) => (e: FormEvent) => {
    e.preventDefault();

    const formData: FormData = {};
    // Transform the object of refs into a key:value pair
    Object.keys(refs.current).forEach(
      (key) => (formData[key] = refs.current[key])
    );

    callback(formData, e);
  };

  return { register, submit };
}

export * from './types';
