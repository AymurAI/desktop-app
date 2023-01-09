import { DocFile } from 'types/file';
import logger from 'utils/logger';
import { joinValidation } from './utils';

/**
 * Exports the file validation and predictions as a JSON file
 * @param file File to be exported
 */
export default async function exportFeedback(file: DocFile) {
  const { name } = file.data;
  const { filesystem } = window;

  const feedback = joinValidation(file);

  // Check if the prealod script was loaded successfully
  if (filesystem) {
    await filesystem.feedback.export(name, feedback);
  } else {
    logger.error(
      'There was an error trying to use the "feedback" API, check your preload script'
    );
  }
}
