import { PredictionFeedback } from 'types/aymurai';
import { DocFile } from 'types/file';
import logger from 'utils/logger';

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

/**
 * Exports the file validation and predictions as a JSON file
 * @param file File to be exported
 */
export default async function exportFeedback(file: DocFile) {
  const { name } = file.data;
  const { filesystem } = window;

  const feedback = joinValidation(file);

  // Check if the prealod script was loaded successfully
  if (filesystem) {
    await filesystem.feedback.export(name, feedback);
  } else {
    logger.error(
      'There was an error trying to use the "feedback" API, check your preload script'
    );
  }
}
