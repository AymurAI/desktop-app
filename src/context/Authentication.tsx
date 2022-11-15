import { createContext, ReactNode, useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';

import { GoogleToken } from 'types/google';
import { CLIENT_ID } from 'utils/config';

type AuthContextType = {
  token: GoogleToken | null;
  setToken: (token: GoogleToken) => void;
};
/**
 * Provides the token received through OAuth2 login to the whole app
 */
export const AuthenticationContext = createContext<AuthContextType>({
  token: null,
  setToken: () => {},
});

interface Props {
  children?: ReactNode;
}
/**
 * Provider for `AuthenticationContext`. Its main purpose is to serve as an interface for `GoogleOAuthProvider`
 */
export default function AuthProvider({ children }: Props) {
  const [token, setToken] = useState<GoogleToken | null>(null);

  const updateToken = (newToken: GoogleToken) => {
    setToken(newToken);
  };

  return (
    <AuthenticationContext.Provider value={{ token, setToken: updateToken }}>
      <GoogleOAuthProvider clientId={CLIENT_ID}>{children}</GoogleOAuthProvider>
    </AuthenticationContext.Provider>
  );
}
