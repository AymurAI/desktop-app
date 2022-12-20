import { CLIENT_ID } from 'utils/config';
import logger from 'utils/logger';

const { oauth } = window;

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

/**
 * Interface for the code challenge method on the main process
 * @returns Code challenge `string`
 */
async function getCodeChallenge() {
  // Check if the prealod script was loaded successfully
  if (oauth) {
    return oauth.getCodeChallenge();
  } else {
    logger.error(
      'There was an error trying to use the "oauth" API, check your preload script'
    );
  }
}

/**
 * Opens the consent screen in the default browser, outside Electron
 */
export async function openConsentScreen() {
  const challenge = await getCodeChallenge();

  if (challenge) {
    const url = new URL(AUTH_URL);

    url.searchParams.append('client_id', CLIENT_ID);
    url.searchParams.append('redirect_uri', 'aymurai.app:/auth');
    url.searchParams.append('response_type', 'code');
    url.searchParams.append('scope', 'email');
    url.searchParams.append('code_challenge', challenge);
    url.searchParams.append('code_challenge_method', 'S256');

    window.open(url.href, '_blank');
  } else {
    throw new Error('Challenge code is undefined!');
  }
}
