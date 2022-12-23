import axios from 'axios';

import { GoogleToken, RefreshTokenResponse } from 'types/google';
import { TOKEN_URL } from './utils';
import { CLIENT_ID } from 'utils/config';

/**
 * Exchanges the refresh token to receive a new access token to use with Google APIs
 * @param refreshToken Refresh token
 * @returns A new access token
 */
export default async function getNewToken(refreshToken: GoogleToken) {
  const url = new URL(TOKEN_URL);
  url.searchParams.append('client_id', CLIENT_ID);
  url.searchParams.append('grant_type', 'refresh_token');
  url.searchParams.append('refresh_token', refreshToken);

  const { data } = await axios.post<RefreshTokenResponse>(url.href);

  return data.access_token;
}
