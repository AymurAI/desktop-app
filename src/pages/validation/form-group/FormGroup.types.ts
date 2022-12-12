export type GetValueFunction = (label: string) => string;
export type GetSuggestionFunction = (label: string) => string;
export type GetCheckedFunction = (label: string) => boolean;

export interface FormProps {
  fileName: string;
  getValue: GetValueFunction;
  getSuggestion: GetSuggestionFunction;
  getChecked: GetCheckedFunction;
}
