export enum FeatureFlowEnum {
  Dataset = "DATA_SET",
  Anonymizer = "ANONYMIZER",
  VoiceToText = "VOICE_TO_TEXT",
  Recomendaciones = "RECOMENDACIONES",
  Summarizer = "SUMMARIZER",
}

export const featureNamespace = {
  [FeatureFlowEnum.Dataset]: "dataset",
  [FeatureFlowEnum.Anonymizer]: "anonymizer",
  [FeatureFlowEnum.VoiceToText]: "voice-to-text",
  [FeatureFlowEnum.Recomendaciones]: "recomendaciones",
  [FeatureFlowEnum.Summarizer]: "summarizer",
} as const satisfies Record<FeatureFlowEnum, string>;
