export enum FeatureFlowEnum {
  Dataset = "DATA_SET",
  Anonymizer = "ANONYMIZER",
  VoiceToText = "VOICE_TO_TEXT",
}

export const featureNamespace = {
  [FeatureFlowEnum.Dataset]: "dataset",
  [FeatureFlowEnum.Anonymizer]: "anonymizer",
  [FeatureFlowEnum.VoiceToText]: "voice-to-text",
} as const satisfies Record<FeatureFlowEnum, string>;
