import { GoogleUser, GoogleToken } from './google';

/**
 * Type referring to the info retrieved by Google API and the acess token from OAuth2
 */
export type User = GoogleUser & {
  token: GoogleToken;
};
