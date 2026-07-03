import type { ExportBlock } from "../types";

/**
 * Shared "[timestamp] Speaker:" prefix used by every format so txt/odt (and
 * later srt/preview) render the same block metadata consistently.
 */
export function blockPrefix(block: ExportBlock): string {
  return [
    block.timestamp && `[${block.timestamp}]`,
    block.speaker && `${block.speaker}:`,
  ]
    .filter(Boolean)
    .join(" ");
}
