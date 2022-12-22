import axios from 'axios';

import { GoogleTokenResponse as TokenResponse } from 'types/google';
import { CLIENT_ID } from 'utils/config';
import logger from 'utils/logger';
import oauth, { TOKEN_URL } from './utils';

type Tokens = {
  token: TokenResponse['access_token'];
  refreshToken: TokenResponse['refresh_token'];
};
type OnceTokenReceived = (tokens: Tokens) => void;
/**
 * Token receiver handler, used to add the tokens to the `Context`
 * @param callback Receives the token as arguments and returns `void`
 */
export default async function onceTokenReceived(callback: OnceTokenReceived) {
  const verifier = await oauth().getVerifierCode();
  const url = new URL(TOKEN_URL);

  oauth().onceAuthCodeReceived(async (authCode) => {
    if (authCode) {
      url.searchParams.append('client_id', CLIENT_ID);
      url.searchParams.append('code', authCode);
      url.searchParams.append('code_verifier', verifier);
      url.searchParams.append('grant_type', 'authorization_code');
      url.searchParams.append('redirect_uri', 'aymurai.app:/auth');

      // Request tokens from the API
      const response = await axios.post<TokenResponse>(url.href);
      const { access_token, refresh_token } = response.data;

      callback({
        token: access_token,
        refreshToken: refresh_token,
      });
    } else {
      logger.error(
        `Sign in process canceled or failed! auth_code is ${authCode}`
      );
    }
  });
}
