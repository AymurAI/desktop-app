export enum FeatureFlowEnum {
  Dataset = "DATA_SET",
  Anonymizer = "ANONYMIZER",
  VoiceToText = "VOICE_TO_TEXT",
  Recomendaciones = "RECOMENDACIONES",
}

export const featureNamespace = {
  [FeatureFlowEnum.Dataset]: "dataset",
  [FeatureFlowEnum.Anonymizer]: "anonymizer",
  [FeatureFlowEnum.VoiceToText]: "voice-to-text",
  [FeatureFlowEnum.Recomendaciones]: "recomendaciones",
} as const satisfies Record<FeatureFlowEnum, string>;
