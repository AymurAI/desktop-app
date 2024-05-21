import { DocumentParagraph, PredictLabel } from './aymurai';
import { FormData } from 'hooks/useForm';

/**
 * Type that defines the properties of a processed file
 */
export type DocFile = {
  /**
   * .doc or .docx file contents
   */
  data: File;
  /**
   * File paragraph data and their metadate
   */
  paragraphs?: DocumentParagraph[];
  /**
   * Used on the 'preview' page to detect which files have to be processed
   */
  selected: boolean;
  /**
   * Predictions made by the AI
   */
  predictions?: PredictLabel[];
  /**
   * Is the file validated by the validation form? This is toggled when the user clicks on the 'Validar documento' button
   */
  validated?: boolean;
  /**
   * Data from the form
   */
  validationObject: FormData;
};
