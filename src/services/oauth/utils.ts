export const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
export const TOKEN_URL = 'https://oauth2.googleapis.com/token';
export const SCOPES =
  'email profile https://www.googleapis.com/auth/spreadsheets';

/**
 * Interface for the oauth preloaded script on the main process
 * @returns OAuth functionalities
 */
export default function oauth() {
  if (window.oauth) return window.oauth;
  else
    throw new Error(
      'There was an error trying to use the "oauth" API, check your preload script'
    );
}
