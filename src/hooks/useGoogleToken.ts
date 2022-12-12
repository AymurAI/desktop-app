import { GoogleToken } from 'types/google';
import useUser from './useUser';

/**
 * Works as an interface for the `AuthenticationContext`, exposing the `token`
 * @returns The token provided by the OAuth2 login
 */
export default function useGoogleToken(): GoogleToken | null {
  const user = useUser();

  return user?.token ?? null;
}
