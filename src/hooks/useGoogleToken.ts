import { useContext } from 'react';

import { AuthenticationContext as Context } from 'context/Authentication';
import { GoogleToken } from 'types/google';

/**
 * Works as an interface for the `AuthenticationContext`, exposing the `token`
 * @returns The token provided by the OAuth2 login
 */
export default function useGoogleToken(): GoogleToken | null {
  const { token } = useContext(Context);

  return token;
}
