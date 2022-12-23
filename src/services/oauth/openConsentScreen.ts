import { CLIENT_ID } from 'utils/config';
import oauth, { AUTH_URL, SCOPES } from './utils';

/**
 * Opens the consent screen in the default browser, outside of Electron
 */
export default async function openConsentScreen() {
  const challenge = await oauth().getChallengeCode();

  if (challenge) {
    const url = new URL(AUTH_URL);

    url.searchParams.append('client_id', CLIENT_ID);
    url.searchParams.append('redirect_uri', 'aymurai.app:/auth');
    url.searchParams.append('response_type', 'code');
    url.searchParams.append('scope', SCOPES);
    url.searchParams.append('code_challenge', challenge);
    url.searchParams.append('code_challenge_method', 'S256');

    window.open(url.href, '_blank');
  } else {
    throw new Error('Challenge code is undefined!');
  }
}
