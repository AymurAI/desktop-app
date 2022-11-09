import { GoogleToken } from 'types/google';

/**
 * Generates auth config to use as Header in API requests
 * @param token Token received on OAuth2 login
 * @returns A _Bearer_ Authorization header
 */
export const auth = (token: GoogleToken) => ({
  Authorization: `Bearer ${token}`,
});
