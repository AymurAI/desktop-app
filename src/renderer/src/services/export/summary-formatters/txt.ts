import { type JSONContent, serializeDocumentToPlainText } from "@aymurai/ui";
import { SUMMARY_WATERMARK_TEXT } from "../watermark";

// Title + body + watermark, blank-line separated — matches
// ../formatters/txt.ts's renderTxt layout for the transcription export.
export function documentToPlainText(
  document: JSONContent,
  title: string,
): string {
  return [title, serializeDocumentToPlainText(document), SUMMARY_WATERMARK_TEXT]
    .filter(Boolean)
    .join("\n\n");
}
