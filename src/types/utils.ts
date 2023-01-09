/**
 * ORs every type to a `null` recursively
 */
export type Nullable<T> = T extends object
  ? {
      [K in keyof T]: Nullable<T[K] | null>;
    }
  : T;
