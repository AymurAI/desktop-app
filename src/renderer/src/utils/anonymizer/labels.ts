import { EXCLUDED_TAGS } from "@/constants/excluded-tags";
import { type AnonymizerLabels, anonymizerLabels } from "@/types/aymurai";
import type { SelectOption } from "@/types/select";

export function getActiveAnonymizerLabelOptions(
  excludedTags: Record<AnonymizerLabels, boolean> | null,
): SelectOption[] {
  const effectiveTags = excludedTags ?? EXCLUDED_TAGS;
  return anonymizerLabels.filter((label) => effectiveTags[label.id] !== false);
}
