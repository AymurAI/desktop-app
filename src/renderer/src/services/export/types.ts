export type ExportFormat = "txt" | "odt" | "pdf";

export interface ExportOptions {
  includeSpeakers: boolean;
  includeTimestamps: boolean;
  includeTitle: boolean;
}

export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  includeSpeakers: true,
  includeTimestamps: true,
  includeTitle: true,
};

export interface ExportBlock {
  speaker?: string;
  timestamp?: string;
  text: string;
}

/**
 * Format-agnostic representation of an exportable transcription: built once
 * from a `Transcription` + `ExportOptions`, then serialized by a per-format
 * renderer (txt, odt, ...). Keeping this as an intermediate step (instead of
 * each formatter reading `Transcription` directly) means a future preview UI
 * can render the same structure as HTML without generating any file at all.
 */
export interface ExportDocument {
  title?: string;
  blocks: ExportBlock[];
}
