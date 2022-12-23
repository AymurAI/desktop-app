import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useRef,
  useState,
} from 'react';

import { User } from 'types/user';
import { REFRESH_INTERVAL } from 'utils/config';

type AuthContextType = {
  user: User | null;
  setUser: Dispatch<SetStateAction<User | null>>;
  startTimer: (callback: () => void) => void;
  resetTimer: () => void;
};
/**
 * Provides the token received through OAuth2 login to the whole app
 */
export const AuthenticationContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  startTimer: () => {},
  resetTimer: () => {},
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
  const timerRef = useRef<number>();

  const startTimer = (callback: () => void) => {
    const timer = window.setInterval(callback, REFRESH_INTERVAL);
    timerRef.current = timer;
  };

  const resetTimer = () => {
    window.clearInterval(timerRef.current);
    timerRef.current = undefined;
  };

  return (
    <AuthenticationContext.Provider
      value={{ user, setUser, startTimer, resetTimer }}
    >
      {children}
    </AuthenticationContext.Provider>
  );
}
