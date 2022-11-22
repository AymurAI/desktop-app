import { useContext } from 'react';

import { AuthenticationContext as Context } from 'context/Authentication';

/**
 * Works as an interface for the `AuthenticationContext`, exposing the GSI script status
 * @returns The load status of GSI script
 */
export default function useGoogleScript() {
  const { hasScriptLoaded } = useContext(Context);

  return hasScriptLoaded;
}
