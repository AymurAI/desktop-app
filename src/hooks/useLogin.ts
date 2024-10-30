import { useContext } from "react";

import { AuthenticationContext as Context } from "context/Authentication";
import google from "services/google";
import oauth from "services/oauth";
import { FunctionType, OnlineUser } from "types/user";

interface UseLoginArgs {
  onLogout?: () => void;
}

/**
 * Hook used to configure the `login` function.
 * @param onLogout Callback function executed when the `logout()` function is called
 * @returns `login()` function which opens a new window to perform the Google authentication and `logout()` function to reset the stored token
 */
export default function useLogin({ onLogout }: UseLoginArgs = {}) {
  const { setUser, startTimer, resetTimer } = useContext(Context);

  const updateToken = async (refreshToken: string) => {
    const newToken = await oauth.getNewToken(refreshToken);

    // Replace the old token
    setUser((cur) => (cur ? ({ ...cur, token: newToken } as OnlineUser) : cur));
  };

  const loginWithGoogle = () => {
    // Opens the window in the OS default browser
    oauth.openConsentScreen();

    // Attachs a one-time listener to this event
    oauth.onceTokenReceived(async ({ token, refreshToken }) => {
      // Fetch user info
      const user = await google(token).user();

      // Check if it's a valid user
      if (user) {
        // Update the state
        setUser({ ...user, token, refreshToken, online: true });

        startTimer(() => updateToken(refreshToken));
      }
    });
  };

  const loginOnline = (funcType: FunctionType) => {
    setUser({ online: false, function: funcType, token: "" });
    onLogout?.();
  };
  const loginOffline = (funcType: FunctionType) => {
    setUser({ online: false, function: funcType, token: "" });
    onLogout?.();
  };

  const login = {
    online: loginOnline,
    offline: loginOffline,
    withGoogle: loginWithGoogle,
  };
  const logout = () => {
    setUser(null);
    resetTimer();
    onLogout?.();
  };

  return { login, logout };
}
