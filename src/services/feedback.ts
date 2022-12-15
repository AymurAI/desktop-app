import { PredictionFeedback } from 'types/aymurai';

function newLabel(
  name: string,
  value: PredictionFeedback['validationText']
): PredictionFeedback {
  return {
    text: null,
    start_char: null,
    end_char: null,
    validationText: value,
    attrs: {
      aymurai_label: name,
      aymurai_label_subclass: null,
      aymurai_alt_text: null,
    },
  };
}

function joinValidation({
  predictions,
  validationObject,
}: DocFile): PredictionFeedback[] {
  // First, add the predictions to the result array
  const result: PredictionFeedback[] = predictions!.map((pred) => ({
    // We are sure predictions is !undefined becasue this step is post file processing
    ...pred,
    validationText: validationObject[pred.attrs.aymurai_label] ?? null,
  }));

  // Get the labels from `validationObject` that aren't present on `preedictions`
  const filtered = Object.keys(validationObject).filter((key) => {
    return !predictions!.find((pred) => pred.attrs.aymurai_label === key);
  });

  // Append the missing labels to the result array
  filtered.forEach((label) =>
    result.push(newLabel(label, validationObject[label] ?? null))
  );

  return result;
}
