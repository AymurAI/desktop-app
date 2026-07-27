import { type JSONContent, serializeDocumentToPlainText } from "@aymurai/ui";

export function documentToPlainText(document: JSONContent): string {
  return serializeDocumentToPlainText(document);
}
