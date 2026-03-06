import {
  Database,
  Detective,
  FileArrowDown,
  FileAudio,
  FileText,
  type Icon,
} from "phosphor-react";
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
  [FeatureFlowEnum.VoiceToText]: {
    title: featureName(FeatureFlowEnum.VoiceToText),
    subtitle: "Convierte archivos de audio en texto",
    icon: FileAudio,
  },
  [FeatureFlowEnum.Summary]: {
    title: featureName(FeatureFlowEnum.Summary),
    subtitle: "Resume textos largos o resoluciones",
    icon: FileText,
  },
  [FeatureFlowEnum.PdfToWord]: {
    title: featureName(FeatureFlowEnum.PdfToWord),
    subtitle: "Convierte documentos PDF a formato Word",
    icon: FileArrowDown,
  },
};

/**
 * Only allow these extensions to be analyzed
 */
export const WHITELISTED_EXTENSIONS = ["doc", "docx", "pdf"];
