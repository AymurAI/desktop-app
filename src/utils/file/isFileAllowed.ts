import getExtension from './getExtension';

/**
 * Runs a check on a file, validating its extension
 * @param file `File` to check
 * @returns `true` if the file is allowed, `false` otherwise
 */
export default function isFileAllowed(file: File) {
  const ALLOWED_EXT = ['doc', 'docx'];

  // Check for whitelisted extensions
  return !!ALLOWED_EXT.find((ext) => ext === getExtension(file));
}
