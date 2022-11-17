import { TokenResponse } from '@react-oauth/google';

/**
 * Token retrieved from OAuth2
 */
export type GoogleToken = TokenResponse['access_token'];

/**
 * User info retrieved from Google User API
 */
export type GoogleUser = {
  email: string;
  email_verified: boolean;
  family_name: string;
  given_name: string;
  hd: string;
  locale: string;
  name: string;
  picture: string;
  sub: string;
};
