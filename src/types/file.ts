import { PredictSuccess } from './predict';

/**
 * Type for
 */
export type DocFile = {
  data: File;
  selected: boolean;
  predictions?: PredictSuccess['labels'];
};
