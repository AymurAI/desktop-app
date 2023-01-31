import fs from 'node:fs/promises';
import { shell } from 'electron';

import { EXPORTS_FOLDER } from '../env';

const FILENAME = 'set_de_datos.xlsx';
const PATH = `${EXPORTS_FOLDER}/${FILENAME}`;

/**
 * Reads the raw data from the data_set excel file
 * @returns The `Promise<Buffer>` read from the file
 */
function read() {
  return fs.readFile(PATH);
}

/**
 * Writes a .xlsx file to the filesystem
 * @param buffer Data buffer to write. This is the .xlsx file
 */
function write(buffer: Buffer) {
  fs.writeFile(PATH, buffer);
}

/**
 * Opens the previously created .xlsx using the default app
 * @returns Message if the opening was succesfull or not
 */
function open() {
  return shell.openPath(PATH);
}

const excel = {
  read,
  write,
  open,
};
export default excel;
