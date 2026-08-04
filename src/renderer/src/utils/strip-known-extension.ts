/**
 * Strips a trailing known extension (case-insensitive) from a file name or
 * title, given a specific list of extensions to check against (e.g.
 * `MEDIA_EXTENSIONS` or `DOCUMENT_EXTENSIONS` from `@/constants/config`).
 * Used both to derive a default title from a source file name, and to keep
 * that extension from leaking into export file names (e.g. "audiencia.wav"
 * shouldn't become "audiencia.wav.txt").
 */
export function stripKnownExtension(
  name: string,
  extensions: string[],
): string {
  const lowerName = name.toLowerCase();
  const extension = extensions.find((ext) =>
    lowerName.endsWith(`.${ext.toLowerCase()}`),
  );
  if (!extension) return name;

  const extensionLength = extension.length + 1;
  return name.length > extensionLength ? name.slice(0, -extensionLength) : name;
}
