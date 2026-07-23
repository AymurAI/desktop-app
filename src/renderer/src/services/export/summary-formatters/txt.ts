import { type RichTextDocument, serializeToPlainText } from "@aymurai/ui";

export function documentToPlainText(document: RichTextDocument): string {
  return serializeToPlainText(document);
}
