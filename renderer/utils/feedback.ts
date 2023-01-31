import { promises as fs } from 'fs';

import { EXPORTS_FOLDER } from '../env';
import filesystem from './filesystem';

const FEEDBACK_FOLDER = `${EXPORTS_FOLDER}/feedback`;

function getDate() {
  const now = new Date(Date.now());
  const [date, time] = now.toISOString().split('T');

  const fileDate = `${date}-${
    time // Time in format xx:yy:zz.zzz
      .split('.')[0] // We are left with xx:yy:zz
      .replace(/:/g, '_') // Transform it into xx_yy_zz
  }`;

  return fileDate;
}

function formatName(fileName: string) {
  // Remove extension and spaces from the name
  const formattedName = fileName
    .replace(/\.docx|\.doc/g, '') // Remove extension
    .replace(/\s/g, '_'); // Remove whitespace

  return `aymurai--${formattedName}`;
}

function getFolder() {
  const home = `${EXPORTS_FOLDER}/feedback`; // This path is based on Windows OS

  return home;
}

async function mkdir() {
  const dataPath = getFolder();
  await fs.mkdir(dataPath, { recursive: true });
}

/**
 * Parses a validation object into a JSON that is writed into a feedback file
 * @param fileName Name of the file
 * @param content Validation object
 */
async function exportFeedback(fileName: string, content: object) {
  const date = getDate();
  const name = formatName(fileName);
  const dataPath = getFolder();
  const json = JSON.stringify(content);

  // Create directory if necessary
  if (!(await filesystem.exists(FEEDBACK_FOLDER))) {
    await mkdir();
  }

  // Create file
  await fs.writeFile(`${dataPath}/${name}--${date}.json`, json, { flag: 'w' });
}

const feedback = {
  export: exportFeedback,
};
export default feedback;
