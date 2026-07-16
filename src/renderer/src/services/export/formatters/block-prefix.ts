import type { ExportBlock } from "../types";

/**
 * Shared "[timestamp] Speaker:" prefix used by every format so txt/odt (and
 * later srt/preview) render the same block metadata consistently. The colon
 * marks the end of the metadata (whatever is present), not specifically the
 * speaker: "[00:36]: text" when only the timestamp is included, "Persona 1:
 * text" when only the speaker is, and no colon at all when neither is.
 */
export function blockPrefix(block: ExportBlock): string {
  const parts = [
    block.timestamp && `[${block.timestamp}]`,
    block.speaker,
  ].filter(Boolean);
  return parts.length > 0 ? `${parts.join(" ")}:` : "";
}
