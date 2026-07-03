import { MEDIA_EXTENSIONS } from "@/constants/config";

/**
 * Strips a trailing known audio/video extension (case-insensitive) from a
 * file name or title. Used both to derive a transcription's default title
 * from its source file name, and to keep that extension from leaking into
 * export file names (e.g. "audiencia.wav" shouldn't become "audiencia.wav.txt").
 */
export function stripKnownMediaExtension(name: string): string {
  const lowerName = name.toLowerCase();
  const extension = MEDIA_EXTENSIONS.find((ext) =>
    lowerName.endsWith(`.${ext.toLowerCase()}`),
  );
  if (!extension) return name;

  const extensionLength = extension.length + 1;
  return name.length > extensionLength ? name.slice(0, -extensionLength) : name;
}
