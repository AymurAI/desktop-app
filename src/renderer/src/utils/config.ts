/**
 * AI Predict port
 */
export const PREDICT_PORT = 8899;

/**
 * Only allow these extensions to be analyzed
 */
export const WHITELISTED_EXTENSIONS = [
  "doc",
  "docx",
  "pdf",
  "mp3",
  "wav",
  "m4a",
  "webm",
  "ogg",
  "flac",
];

/**
 * Dataset Spreadsheet
 */
export const DATASET_URL =
  "https://docs.google.com/spreadsheets/d/1pzaGNM5BzRAOlj8p0NYtxnkU4VI_X5UcQsnIMOtLSVY/edit#gid=257379348";

/**
 * AymurAI API URL — fallback only. The active base URL comes from the
 * server-selection page (Zustand `localStore.serverHost`) which patches
 * `api.defaults.baseURL` on connect.
 */
export const AYMURAI_API_URL = `http://localhost:${PREDICT_PORT}`;

export const USE_MOCK_STT = import.meta.env.VITE_USE_MOCK_STT === "true";
export const STT_MOCK_DELAY_MS = Number(
  import.meta.env.VITE_STT_MOCK_DELAY_MS ?? 4000,
);

// Cache ON in production, OFF in dev. Override with VITE_ASR_USE_CACHE=true|false.
export const USE_ASR_CACHE =
  import.meta.env.VITE_ASR_USE_CACHE !== undefined
    ? import.meta.env.VITE_ASR_USE_CACHE === "true"
    : import.meta.env.PROD;
