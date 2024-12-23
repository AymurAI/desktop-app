/**
 * Google App Client ID (extracted from Google Developer Console)
 */
export const CLIENT_ID = process.env.REACT_APP_CLIENT_ID ?? "";

/**
 * AI Predict port
 */
export const PREDICT_PORT = 8899;

/**
 * Only allow these extensions to be analyzed
 */
export const WHITELISTED_EXTENSIONS = ["doc", "docx"];

/**
 * Dataset Spreadsheet
 */
export const DATASET_URL =
  "https://docs.google.com/spreadsheets/d/1pzaGNM5BzRAOlj8p0NYtxnkU4VI_X5UcQsnIMOtLSVY/edit#gid=257379348";

/**
 * Token refresh interval = 45 min x 60s x 1000ms
 */
export const REFRESH_INTERVAL = 45 * 60 * 1000;

/**
 * AymurAI API URL
 */
export const AYMURAI_API_URL = `http://localhost:8900`;
