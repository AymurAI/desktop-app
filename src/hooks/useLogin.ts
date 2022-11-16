import { TokenResponse, useGoogleLogin } from '@react-oauth/google';
import { AuthenticationContext as Context } from 'context/Authentication';
import { useContext } from 'react';

interface UseLoginArgs {
  onSuccess?: () => void;
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
  const { setToken } = useContext(Context);

  const login = useGoogleLogin({
    onSuccess: async (res) => {
      setToken(res.access_token);
      onSuccess?.();
    },
    onError: async (err) => {
      console.error('An error ocurred while retrieving the OAuth2 token', err);
      onError?.(err);
    },
  });

  const logout = () => {
    onLogout?.();
    setToken(null);
  };

  return { login, logout };
}
