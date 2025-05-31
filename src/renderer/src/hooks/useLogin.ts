import { useContext } from "react";

import { AuthenticationContext as Context } from "@/context/Authentication";
import type { FunctionType } from "@/types/user";

interface UseLoginArgs {
  onLogout?: () => void;
}

/**
 * Hook used to configure the `login` function.
 * @param onLogout Callback function executed when the `logout()` function is called
 * @returns `login()` function which opens a new window to perform the Google authentication and `logout()` function to reset the stored token
 */
export default function useLogin({ onLogout }: UseLoginArgs = {}) {
  const { setUser } = useContext(Context);

  const loginOffline = (funcType: FunctionType) => {
    setUser({ online: false, function: funcType, token: "" });
    onLogout?.();
  };

  const login = {
    offline: loginOffline,
  };
  const logout = () => {
    setUser(null);
    onLogout?.();
  };

  return { login, logout };
}
