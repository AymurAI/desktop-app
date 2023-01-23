/**
 * ORs every type to a `null` recursively
 */
export type Nullable<T> = T extends object
  ? {
      [K in keyof T]: Nullable<T[K] | null>;
    }
  : T;

/**
 * Makes a single property of T optional
 * @param T Type to analyze
 * @param K keys of T that must be optional
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * The opposite of Optional. Makes a single property of T required
 * @param T Type to analyze
 * @param K keys of T that must be required
 */
export type Necessary<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
