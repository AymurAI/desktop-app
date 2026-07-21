import { WHITELISTED_EXTENSIONS } from "@/constants/config";
import getExtension from "./getExtension";

/**
 * Runs a check on a file, validating its extension
 * @param file `File` to check
 * @returns `true` if the file is allowed, `false` otherwise
 */
export default function isAllowed(
  file: File,
  extensions: string[] = WHITELISTED_EXTENSIONS,
) {
  const extension = getExtension(file);
  return extension !== undefined && extensions.includes(extension);
}
