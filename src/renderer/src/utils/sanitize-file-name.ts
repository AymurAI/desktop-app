import { stripKnownExtension } from "./strip-known-extension";

// Only characters that are actually illegal in a filename on Windows/macOS/
// Linux — everything else (accents, º, brackets, dashes, apostrophes...) is
// kept as-is so the exported file name reads like the source title.
// biome-ignore lint/suspicious/noControlCharactersInRegex: intentionally stripping control chars, which are also illegal in file names
const ILLEGAL_FILENAME_CHARS = /[<>:"/\\|?*\x00-\x1F]/g;

/**
 * Builds a safe base file name (no extension) from a title: strips a
 * trailing known extension (so a title seeded from a source file name, e.g.
 * "acta.docx" or "audiencia.wav", doesn't leak that extension into the
 * export's own — "acta.docx.txt"), strips OS-illegal filename characters,
 * and falls back to `defaultName` if nothing usable remains.
 */
export function sanitizeFileName(
  title: string,
  extensions: string[],
  defaultName: string,
): string {
  const sanitized = stripKnownExtension(title.trim(), extensions)
    .replace(ILLEGAL_FILENAME_CHARS, "")
    .trim();
  return sanitized || defaultName;
}
