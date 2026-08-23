import { DOCUMENT_EXTENSIONS } from "@/constants/config";

/** The two input formats `/anonymizer/anonymize-document` accepts. */
export type AnonymizerInputFormat = "docx" | "pdf";

// Inverse of the backend's own MIMETYPE_EXTENSION_MAPPER
// (aymurai/text/extraction.py) — kept in sync so the UI's idea of the input
// type matches what the backend will detect for the same upload.
const MIME_TO_FORMAT: Record<string, AnonymizerInputFormat> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
};

/**
 * Resolves an uploaded file's format, preferring the file name's extension
 * (what the flow has always used) and falling back to the browser-reported
 * MIME type. Returns null when neither identifies a supported input.
 */
export function getAnonymizerInputFormat(
  file: File,
): AnonymizerInputFormat | null {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (DOCUMENT_EXTENSIONS.includes(extension))
    return extension as AnonymizerInputFormat;

  return MIME_TO_FORMAT[file.type] ?? null;
}
