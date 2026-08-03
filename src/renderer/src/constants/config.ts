import { FeatureFlowEnum } from "@/types/features";
import {
  Database,
  Detective,
  FileAudio,
  type Icon,
  Megaphone,
} from "phosphor-react";

export const DATAGENERO_URL = "https://www.datagenero.org/";

/** AI Predict port */
export const PREDICT_PORT = 8899;

/** Document extensions accepted by the dataset/anonymizer flows. */
export const DOCUMENT_EXTENSIONS = ["docx", "pdf"];

/** Audio extensions accepted by the voice-to-text flow. */
export const AUDIO_EXTENSIONS = ["mp3", "wav", "m4a", "webm", "ogg", "flac"];

/** Video extensions accepted by the voice-to-text flow. */
export const VIDEO_EXTENSIONS = ["mp4", "mov", "mkv", "avi", "m4v"];

/** Media extensions accepted by the voice-to-text flow. */
export const MEDIA_EXTENSIONS = [...AUDIO_EXTENSIONS, ...VIDEO_EXTENSIONS];

/** Union — kept for any consumer that needs to know "is this analyzable at all". */
export const WHITELISTED_EXTENSIONS = [
  ...DOCUMENT_EXTENSIONS,
  ...MEDIA_EXTENSIONS,
];

/** Dataset Spreadsheet */
export const DATASET_URL =
  "https://docs.google.com/spreadsheets/d/1pzaGNM5BzRAOlj8p0NYtxnkU4VI_X5UcQsnIMOtLSVY/edit#gid=257379348";

/**
 * AymurAI API URL — fallback only. The active base URL comes from the
 * server-selection page (Zustand `localStore.serverHost`) which patches
 * `api.defaults.baseURL` on connect.
 */
export const AYMURAI_API_URL = `http://localhost:${PREDICT_PORT}`;

export const FEATURE_ICON: Record<FeatureFlowEnum, Icon> = {
  [FeatureFlowEnum.Dataset]: Database,
  [FeatureFlowEnum.Anonymizer]: Detective,
  [FeatureFlowEnum.VoiceToText]: FileAudio,
  [FeatureFlowEnum.Recomendaciones]: Megaphone,
};

export const USE_MOCK_STT = import.meta.env.VITE_USE_MOCK_STT === "true";
export const STT_MOCK_DELAY_MS = Number(
  import.meta.env.VITE_STT_MOCK_DELAY_MS ?? 4000,
);

/**
 * Development aid for the Recomendaciones flow: when the backend LLM
 * extraction / persistence endpoints aren't available, short-circuit them
 * with a realistic fixture instead. Off by default — mirrors `USE_MOCK_STT`.
 */
export const USE_MOCK_RECOMENDACIONES =
  import.meta.env.VITE_USE_MOCK_RECOMENDACIONES === "true";
export const RECOMENDACIONES_MOCK_DELAY_MS = Number(
  import.meta.env.VITE_RECOMENDACIONES_MOCK_DELAY_MS ?? 1200,
);

// Cache ON in production, OFF in dev. Override with VITE_ASR_USE_CACHE=true|false.
export const USE_ASR_CACHE =
  import.meta.env.VITE_ASR_USE_CACHE !== undefined
    ? import.meta.env.VITE_ASR_USE_CACHE === "true"
    : import.meta.env.PROD;
