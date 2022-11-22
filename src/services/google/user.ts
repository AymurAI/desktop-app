import axios from 'axios';

import { GoogleToken } from 'types/google';
import { User } from 'types/user';
import { auth } from './utils';

/**
 * Local fetcher to fetch with User related information
 */
const fetcher = axios.create({
  baseURL: 'https://www.googleapis.com/oauth2/v3/userinfo',
});

/**
 * Fetches all the user info
 * @param token Authorization token from OAuth2
 * @returns All the info related to the OAuth2 token. Including profile picture, email, id, etc
 */
export async function getUser(token: GoogleToken) {
  const { data } = await fetcher.get<User>('/', { headers: auth(token) });
  return data;
}
