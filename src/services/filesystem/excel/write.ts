import filesystemAPI from '../utils';

/**
 * Writes the `.xlsx` in Buffer format to the filesystem
 * @param buffer Data buffer representing the `.xlsx` file
 */
export default function write(buffer: Buffer) {
  return filesystemAPI().excel.write(buffer);
}
