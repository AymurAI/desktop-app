import { EXCLUDED_TAGS } from "@/constants/excluded-tags";
import {
  type AnonymizerLabels,
  type PredictLabel,
  anonymizerLabels,
} from "@/types/aymurai";
import {
  normalizeEntityText,
  stripEntityLabelSuffix,
} from "./entity-similarity";

const ANONYMIZER_LABEL_IDS = new Set<string>(
  anonymizerLabels.map((label) => label.id),
);

export function stripLabelSuffix(label: string): string {
  return stripEntityLabelSuffix(label);
}

function getAnonymizerLabelId(label: string): AnonymizerLabels | null {
  const baseLabel = stripLabelSuffix(label);
  return ANONYMIZER_LABEL_IDS.has(baseLabel)
    ? (baseLabel as AnonymizerLabels)
    : null;
}

export function isPredictionActive(
  prediction: PredictLabel,
  excludedTags: Record<AnonymizerLabels, boolean> | null,
  excludedWords: string[],
): boolean {
  const effectiveTags = excludedTags ?? EXCLUDED_TAGS;
  const labelId = getAnonymizerLabelId(String(prediction.attrs.aymurai_label));

  if (labelId !== null && effectiveTags[labelId] === false) return false;

  const predictionText = normalizeEntityText(prediction.text);
  return !excludedWords.some(
    (word) => normalizeEntityText(word) === predictionText,
  );
}

export function filterActivePredictions(
  predictions: PredictLabel[] | undefined,
  excludedTags: Record<AnonymizerLabels, boolean> | null,
  excludedWords: string[],
): PredictLabel[] {
  return (predictions ?? []).filter((prediction) =>
    isPredictionActive(prediction, excludedTags, excludedWords),
  );
}

export function anonymizeQuerySignature(
  predictions: PredictLabel[] | undefined,
  excludedTags: Record<AnonymizerLabels, boolean> | null,
  excludedWords: string[],
): string[] {
  return filterActivePredictions(predictions, excludedTags, excludedWords).map(
    (prediction) =>
      [
        prediction.mentionId,
        prediction.paragraphId,
        prediction.start_char,
        prediction.end_char,
        prediction.text,
        prediction.attrs.aymurai_label,
        prediction.attrs.canonical_entity_id ?? "",
        prediction.attrs.aymurai_anonymize ?? "",
      ].join("\u001f"),
  );
}
