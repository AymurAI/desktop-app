/**
 * Centralized web/desktop runtime detection, backed by the `VITE_APP_MODE`
 * build-time flag already set by the `dev`/`dev:web`/`build`/`build:web`
 * scripts. Exported as functions (not frozen consts) so callers always read
 * the live value instead of one captured at first import.
 */
export function isElectronApp(): boolean {
  return import.meta.env.VITE_APP_MODE === "electron";
}

export function isWebApp(): boolean {
  return !isElectronApp();
}
