import { createContext, ReactNode, useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';

import { CLIENT_ID } from 'utils/config';
import { User } from 'types/user';

type AuthContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  hasScriptLoaded: boolean;
};
/**
 * Provides the token received through OAuth2 login to the whole app
 */
export const AuthenticationContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  hasScriptLoaded: false,
});
AuthenticationContext.displayName = 'AuthenticationContext';

interface Props {
  children?: ReactNode;
}
/**
 * Provider for `AuthenticationContext`. Its main purpose is to serve as an interface for `GoogleOAuthProvider`
 */
export default function AuthProvider({ children }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [hasScriptLoaded, setHasScriptLoaded] = useState(false);

  const updateUser = (user: User | null) => {
    setUser(user);
  };

  const updateScriptStatus = () => {
    setHasScriptLoaded(true);
  };

  return (
    <AuthenticationContext.Provider
      value={{ user, setUser: updateUser, hasScriptLoaded }}
    >
      <GoogleOAuthProvider
        clientId={CLIENT_ID}
        onScriptLoadSuccess={updateScriptStatus}
      >
        {children}
      </GoogleOAuthProvider>
    </AuthenticationContext.Provider>
  );
}
