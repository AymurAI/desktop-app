import type {
  SelectSuggestion,
  SelectOption as UiSelectOption,
} from "@aymurai/ui";

export type SelectOption = UiSelectOption & {
  shortText?: string;
};

export type { SelectSuggestion };
