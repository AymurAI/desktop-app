import { useContext } from "react";

import { AnonymizerContext as Context } from "context/Anonymizer";

/**
 * Works as an interface for the `AnonymizerContext`, exposing the anonymized information
 * @returns a string
 */
export default function useAnonymizer(): string {
  const { anonymizedText } = useContext(Context);

  return anonymizedText;
}
