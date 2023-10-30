import { SelectOption } from "components/select";

export interface Props {
  onChange: (text: string, selected?: boolean) => void;
  onSelectChange?: (object: SelectOption | undefined) => void;
  html: string;
  word: string;
}
