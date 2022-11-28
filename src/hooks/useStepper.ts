import Context from 'context/File';
import { useContext } from 'react';

/**
 * Works as an interface for the `FileContext`, exposing functions to move forward or backwards the validation step
 * @returns `nextStep` and `previousStep` functions
 */
export default function useStepper() {
  const { step, setStep } = useContext(Context);

  const nextStep = () => setStep(step + 1);
  const previousStep = () => setStep(step - 1);
  const resetStepper = () => setStep(0);

  return { nextStep, previousStep, resetStepper };
}
