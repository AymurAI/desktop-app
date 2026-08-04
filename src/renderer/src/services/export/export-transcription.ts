import { MEDIA_EXTENSIONS } from "@/constants/config";
import { convertOdtToPdf } from "@/services/aymurai/queries";
import type { Transcription } from "@/types/transcription";
import { sanitizeFileName } from "@/utils/sanitize-file-name";
import { buildExportDocument } from "./build-export-document";
import { renderOdt } from "./formatters/odt";
import { renderTxt } from "./formatters/txt";
import type { ExportFormat, ExportOptions } from "./types";

export interface ExportResult {
  blob: Blob;
  fileName: string;
}

const DEFAULT_FILE_NAME = "transcripcion";

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
  // Titles are often seeded from the source audio's file name (see
  // asrMapper.ts's transcriptionTitleFromFile), so strip a trailing
  // ".wav"/".mp3"/etc. before appending our own export extension — otherwise
  // we'd end up with "name.wav.txt".
  const baseName = sanitizeFileName(
    transcription.title,
    MEDIA_EXTENSIONS,
    DEFAULT_FILE_NAME,
  );
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
