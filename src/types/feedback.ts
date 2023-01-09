import { PredictLabel } from './aymurai';
import { Nullable } from './utils';

/**
 * Type for the object stored into the exported JSON file
 */
export type PredictionFeedback = Nullable<
  PredictLabel & {
    validationText: string | boolean;
  }
>;
