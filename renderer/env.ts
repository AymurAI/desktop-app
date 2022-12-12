// ------------------------
// ENV VARIABLES
// ------------------------

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
