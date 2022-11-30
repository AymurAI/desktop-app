type LabelAttributes = {
  aymurai_label: string;
  aymurai_label_subclass: string[] | null;
  aymurai_alt_text: string | null;
};

export type PredictLabel = {
  text: string;
  start_char: number;
  end_char: number;
  attrs: LabelAttributes;
};
export type PredictSuccess = {
  document: string;
  labels: PredictLabel[];
};
