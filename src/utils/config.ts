/**
 * Google App Client ID (extracted from Google Developer Console)
 */
export const CLIENT_ID = process.env.REACT_APP_CLIENT_ID ?? '';

/**
 * AI Predict port
 */
export const PREDICT_PORT = 8899;

/**
 * Only allow these extensions to be analyzed
 */
export const WHITELISTED_EXTENSIONS = ['doc', 'docx'];
