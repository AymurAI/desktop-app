/**
 * AI Predict port
 */
export const PREDICT_PORT = 8899;

/**
 * Only allow these extensions to be analyzed
 */
export const WHITELISTED_EXTENSIONS = ["doc", "docx", "pdf", "mp3", "wav", "m4a", "webm", "ogg", "flac"];

/**
 * Dataset Spreadsheet
 */
export const DATASET_URL =
  "https://docs.google.com/spreadsheets/d/1pzaGNM5BzRAOlj8p0NYtxnkU4VI_X5UcQsnIMOtLSVY/edit#gid=257379348";

/**
 * AymurAI API URL
 */
export const AYMURAI_API_URL = `http://localhost:${PREDICT_PORT}`;

export const USE_MOCK_STT = false;
export const STT_MOCK_DELAY_MS = 4000;
