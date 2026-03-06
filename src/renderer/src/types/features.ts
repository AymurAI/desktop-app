export enum FeatureFlowEnum {
  Dataset = "DATA_SET",
  Anonymizer = "ANONYMIZER",
  VoiceToText = "VOICE_TO_TEXT",
  Summary = "SUMMARY",
  PdfToWord = "PDF_TO_WORD",
}

export const featureName = (feature: FeatureFlowEnum): string => {
  const names: Record<FeatureFlowEnum, string> = {
    [FeatureFlowEnum.Dataset]: "Set de datos",
    [FeatureFlowEnum.Anonymizer]: "Anonimizador",
    [FeatureFlowEnum.VoiceToText]: "Voz a Texto",
    [FeatureFlowEnum.Summary]: "Resumen",
    [FeatureFlowEnum.PdfToWord]: "PDF a Word",
  };

  return names[feature];
};
