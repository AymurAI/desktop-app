import {
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  createContext,
  useState,
} from "react";

import type { User } from "types/user";

type AuthContextType = {
  user: User | null;
  setUser: Dispatch<SetStateAction<User | null>>;
};
/**
 * Provides the token received through OAuth2 login to the whole app
 */
export const AuthenticationContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
});
AuthenticationContext.displayName = "AuthenticationContext";

interface Props {
  children?: ReactNode;
}
/**
 * Provider for `AuthenticationContext`. Its main purpose is to serve as an interface for `GoogleOAuthProvider`
 */
export default function AuthProvider({ children }: Props) {
  const [user, setUser] = useState<User | null>(null);

  return (
    <AuthenticationContext.Provider value={{ user, setUser }}>
      {children}
    </AuthenticationContext.Provider>
  );
}
