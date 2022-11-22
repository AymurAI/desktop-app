import { useContext } from 'react';
import { TokenResponse, useGoogleLogin } from '@react-oauth/google';

import { AuthenticationContext as Context } from 'context/Authentication';
import { GoogleToken } from 'types/google';
import google from 'services/google';

interface UseLoginArgs {
  onSuccess?: (token: GoogleToken) => void;
  onLogout?: () => void;
  onError?: (
    e: Pick<TokenResponse, 'error' | 'error_description' | 'error_uri'>
  ) => void;
}

/**
 * Hook used to configure the `login` function.
 * @param onSuccess Function to be called when te login succeeds
 * @param onError Function called when an error is thrown
 * @returns `login()` function which opens a new window to perform the Google authentication and `logout()` function to reser the stored token
 */
export default function useLogin({
  onSuccess,
  onError,
  onLogout,
}: UseLoginArgs = {}) {
  const { setUser } = useContext(Context);

  const login = useGoogleLogin({
    onSuccess: async (res) => {
      // Fetch user info
      const data = await google(res.access_token).user();
      setUser({ ...data, token: res.access_token });

      // Pass the token to perform any other action
      onSuccess?.(res.access_token);
    },
    onError: async (err) => {
      console.error('An error ocurred while retrieving the OAuth2 token', err);
      onError?.(err);
    },
  });

  const logout = () => {
    onLogout?.();
    setUser(null);
  };

  return { login, logout };
}
