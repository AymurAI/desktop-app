import { promises as fs } from 'fs';
import { homedir } from 'os';
import path from 'path';

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
  const home = path.resolve(homedir(), 'AppData/Local/AymurAI/feedback'); // This path is based on Windows OS

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
export default async function exportFeedback(
  fileName: string,
  content: object
) {
  const date = getDate();
  const name = formatName(fileName);
  const path = '/Users/aerolab';
  const json = JSON.stringify(content);

  await fs.writeFile(`${path}/${name}--${date}.json`, json, { flag: 'w' });
}
