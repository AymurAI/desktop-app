/**
 * Extracts the extension of the given file
 * @param file File to extract its extension
 * @returns Extension string of the file
 */
export default function getFileExtension(file: File) {
  return file.name.split('.').at(-1);
}
