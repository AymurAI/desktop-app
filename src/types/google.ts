/**
 * Response from the token OAuth endpoint
 */
export type GoogleTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  token_type: 'Bearer';
  id_token: string;
};
/**
 * Response from the refresh token endpoint
 */
export type RefreshTokenResponse = {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: 'Bearer';
};

/**
 * Token retrieved from OAuth2
 */
export type GoogleToken = GoogleTokenResponse['access_token'];

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
