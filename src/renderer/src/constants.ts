import { Database, Detective, type Icon } from "phosphor-react";
import { FeatureFlowEnum, featureName } from "./types/features";

export const DATAGENERO_URL = "https://www.datagenero.org/";

type Feature = { title: string; subtitle: string; icon: Icon };

export const FEATURES: Record<FeatureFlowEnum, Feature> = {
  [FeatureFlowEnum.Dataset]: {
    title: featureName(FeatureFlowEnum.Dataset),
    subtitle: "Convertí resoluciones judiciales en set de datos estructurados",
    icon: Database,
  },
  [FeatureFlowEnum.Anonymizer]: {
    title: featureName(FeatureFlowEnum.Anonymizer),
    subtitle:
      "Anonimiza resoluciones judiciales de manera automática y editable",
    icon: Detective,
  },
};

/**
 * Only allow these extensions to be analyzed
 */
export const WHITELISTED_EXTENSIONS = ["doc", "docx", "pdf"];
