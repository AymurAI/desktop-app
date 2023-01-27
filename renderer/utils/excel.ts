import fs from 'node:fs/promises';
import { EXPORTS_FOLDER } from '../env';

/**
 * Reads the raw data from the data_set excel file
 * @returns The `Promise<Buffer>` read from the file
 */
function read() {
  return fs.readFile(`${EXPORTS_FOLDER}/set_de_datos.xlsx`);
}

function write(buffer: Buffer) {
  // ...
}

const excel = {
  read,
  write,
};
export default excel;
