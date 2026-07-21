import { convertOdtToPdf } from "@/services/aymurai/queries";
import type { Transcription } from "@/types/transcription";
import { stripKnownMediaExtension } from "@/utils/strip-known-media-extension";
import { buildExportDocument } from "./build-export-document";
import { renderOdt } from "./formatters/odt";
import { renderTxt } from "./formatters/txt";
import type { ExportFormat, ExportOptions } from "./types";

export interface ExportResult {
  blob: Blob;
  fileName: string;
}

const DEFAULT_FILE_NAME = "transcripcion";

// Only characters that are actually illegal in a filename on Windows/macOS/
// Linux — everything else (accents, º, brackets, dashes, apostrophes...) is
// kept as-is so the exported file name reads like the transcription's title.
// biome-ignore lint/suspicious/noControlCharactersInRegex: intentionally stripping control chars, which are also illegal in file names
const ILLEGAL_FILENAME_CHARS = /[<>:"/\\|?*\x00-\x1F]/g;

// Titles are often seeded from the source audio's file name (see
// asrMapper.ts's transcriptionTitleFromFile), so strip a trailing
// ".wav"/".mp3"/etc. before appending our own export extension — otherwise
// we'd end up with "name.wav.txt".
function sanitizeFileName(title: string): string {
  const sanitized = stripKnownMediaExtension(title.trim())
    .replace(ILLEGAL_FILENAME_CHARS, "")
    .trim();
  // A title made up entirely of illegal characters (or an empty title) would
  // otherwise produce a bare, hidden-looking file name like ".txt".
  return sanitized || DEFAULT_FILE_NAME;
}

/**
 * Single entry point for turning a `Transcription` into a downloadable file.
 * txt/odt are generated entirely client-side; pdf reuses the anonymizer's
 * existing `/convert/odt/pdf` backend endpoint by feeding it the client-built
 * .odt — there's no backend endpoint that generates a transcription export
 * directly, so this mirrors the anonymizer's own odt-to-pdf step instead of
 * introducing a second PDF generator.
 */
export async function exportTranscription(
  transcription: Transcription,
  format: ExportFormat,
  options: ExportOptions,
): Promise<ExportResult> {
  const doc = buildExportDocument(transcription, options);
  const baseName = sanitizeFileName(transcription.title);
  const blob = await renderExportBlob(doc, format);

  // `format` is already the file extension for every case above.
  return { blob, fileName: `${baseName}.${format}` };
}

async function renderExportBlob(
  doc: ReturnType<typeof buildExportDocument>,
  format: ExportFormat,
): Promise<Blob> {
  switch (format) {
    case "txt":
      return new Blob([renderTxt(doc)], { type: "text/plain;charset=utf-8" });
    case "odt":
      return renderOdt(doc);
    case "pdf": {
      const odtBlob = await renderOdt(doc);
      return convertOdtToPdf(odtBlob);
    }
  }
}
