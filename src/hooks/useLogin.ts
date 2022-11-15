import { TokenResponse, useGoogleLogin } from '@react-oauth/google';
import { AuthenticationContext as Context } from 'context/Authentication';
import { useContext } from 'react';

interface UseLoginArgs {
  onSuccess?: () => void;
  onError?: (
    e: Pick<TokenResponse, 'error' | 'error_description' | 'error_uri'>
  ) => void;
}

/**
 * Hook used to configure the `login` function.
 * @param onSuccess Function to be called when te login succeeds
 * @param onError Function called when an error is thrown
 * @returns `login()` function which opens a new window to perform the Google authentication
 */
export default function useLogin({ onSuccess, onError }: UseLoginArgs = {}) {
  const { setToken } = useContext(Context);

  return useGoogleLogin({
    onSuccess: async (res) => {
      setToken(res.access_token);
      onSuccess?.();
    },
    onError: async (err) => {
      console.error('An error ocurred while retrieving the OAuth2 token', err);
      onError?.(err);
    },
  });
}
