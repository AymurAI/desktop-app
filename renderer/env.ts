// ------------------------
// CONFIG VARIABLES
// ------------------------

/**
 * Port for the development app
 */
export const DEV_PORT = 3000;

/**
 * Custom URI scheme name
 */
export const URI_SCHEME = 'aymurai.app';

/**
 * Is the app in development mode?
 */
export const isDebug = process.env.NODE_ENV === 'development' ?? true;

/**
 * Is the app in development mode?
 */
export const isProduction = process.env.NODE_ENV === 'production' ?? false;
