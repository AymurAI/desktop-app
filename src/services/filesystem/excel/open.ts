import logger from 'utils/logger';
import filesystemAPI from '../utils';

/**
 * Opens the Excel file
 */
export default async function open() {
  const result = await filesystemAPI().excel.open();

  if (result === '')
    logger.error('There was an error while opening the XLSX file!');
}
