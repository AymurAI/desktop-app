import { PredictLabel } from './predict';

/**
 * Type for
 */
export type DocFile = {
  /**
   * .doc or .docx file contents
   */
  data: File;
  /**
   * Used on the 'preview' page to detect which files have to be processed
   */
  selected: boolean;
  /**
   * Predictions made by the AI
   */
  predictions?: PredictLabel[];
  /**
   * Is the file validated by the validation form?
   */
  validated?: boolean;
};
