import { useContext } from 'react';

import { AuthenticationContext as Context } from 'context/Authentication';
import { User } from 'types/user';

/**
 * Works as an interface for the `AuthenticationContext`, exposing all the User information
 * @returns The user retrieved by the UserInfo Google API
 */
export default function useUser(): User | null {
  const { user } = useContext(Context);

  return user;
}
