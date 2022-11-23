import Context from 'context/File';
import { useContext } from 'react';

/**
 * Works as an interface for the `FileContext`, exposing functions to move forward or backwards the validation step
 * @returns `nextStep` and `previousStep` functions
 */
export default function useStepper() {
  const { nextStep, previousStep } = useContext(Context);

  return { nextStep, previousStep };
}
