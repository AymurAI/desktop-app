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
