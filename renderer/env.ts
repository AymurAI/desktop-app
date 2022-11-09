// ------------------------
// ENV VARIABLES
// ------------------------

/**
 * Google App Client ID
 */
export const CLIENT_ID = process.env.CLIENT_ID ?? '';

/**
 * Google App API Key
 */
export const API_KEY = process.env.API_KEY ?? '';

/**
 * Port for the development app
 */
export const PORT = process.env.PORT ?? 3000;

// ------------------------
// CONFIG VARIABLES
// ------------------------

/**
 * Is the app in development mode?
 */
export const isDebug = process.env.NODE_ENV === 'development' ?? true;

/**
 * Is the app in development mode?
 */
export const isProduction = process.env.NODE_ENV === 'production' ?? false;

/**
 * Forces the window to be hidden on start
 */
export const startMinimized = process.env.START_MINIMIZED ?? false;
