import { createContext, ReactNode, useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';

import { CLIENT_ID } from 'utils/config';
import { User } from 'types/user';

type AuthContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
};
/**
 * Provides the token received through OAuth2 login to the whole app
 */
export const AuthenticationContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
});

interface Props {
  children?: ReactNode;
}
/**
 * Provider for `AuthenticationContext`. Its main purpose is to serve as an interface for `GoogleOAuthProvider`
 */
export default function AuthProvider({ children }: Props) {
  const [user, setUser] = useState<User | null>(null);

  const updateUser = (user: User | null) => {
    setUser(user);
  };

  return (
    <AuthenticationContext.Provider value={{ user, setUser: updateUser }}>
      <GoogleOAuthProvider clientId={CLIENT_ID}>{children}</GoogleOAuthProvider>
    </AuthenticationContext.Provider>
  );
}
