import { type JSONContent, serializeDocumentToPlainText } from "@aymurai/ui";
import { SUMMARY_WATERMARK_TEXT } from "../watermark";

export function documentToPlainText(document: JSONContent): string {
  return `${serializeDocumentToPlainText(document)}\n\n${SUMMARY_WATERMARK_TEXT}`;
}
