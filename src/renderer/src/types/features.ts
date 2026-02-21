export enum FeatureFlowEnum {
  Dataset = "DATA_SET",
  Anonymizer = "ANONYMIZER",
}

export const featureName = (feature: FeatureFlowEnum): string => {
  const names: Record<FeatureFlowEnum, string> = {
    [FeatureFlowEnum.Dataset]: "Set de datos",
    [FeatureFlowEnum.Anonymizer]: "Anonimizador",
  };

  return names[feature];
};
