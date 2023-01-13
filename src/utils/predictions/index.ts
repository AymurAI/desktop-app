import { SelectOption } from 'components/select';
import { AllLabels, PredictLabel } from 'types/aymurai';
import { Prediction, PropertyCallback } from './types';

/**
 * Transforms the predictions array into a { [label]: T } form to be used on the getters methods
 * @param predictions Array of predictions
 * @param propertyCallback
 * @returns A predictions array transformed into { [label]: T }
 */
function reducePredictions<T extends any>(
  predictions: PredictLabel[],
  propertyCallback: PropertyCallback<T>
): Prediction<T> {
  const reduced = predictions.reduce(
    (prev, pred) => ({
      ...prev,
      // Append the next value
      [pred.attrs.aymurai_label]: propertyCallback(pred),
    }),
    {}
  );

  return reduced;
}

/* GETTERS */
// Returns the predicted text for the specified `label`
function text(predictions: PredictLabel[], label: AllLabels) {
  const reduced = reducePredictions(predictions, (pred) => pred.text);

  return {
    suggestion: reduced[label],
  };
}

// Returns the predicted text and the suggestion (id and text) for the specified `label`
function select(predictions: PredictLabel[], label: AllLabels) {
  const reduced = reducePredictions(predictions, (pred) => ({
    subclass: pred.attrs.aymurai_label_subclass ?? [],
    text: pred.text,
  }));

  const { subclass, text } = reduced[label] ?? {};

  const hasElements = !!subclass && !!subclass.length;
  const suggestion: SelectOption | undefined =
    hasElements && text ? { id: subclass[0], text } : undefined;

  return {
    priorityOrder: subclass,
    suggestion,
  };
}

export default function predictions(preds: PredictLabel[] = []) {
  return {
    getTextSuggestion: (label: AllLabels) => text(preds, label),
    getSelectSuggestion: (label: AllLabels) => select(preds, label),
  };
}
