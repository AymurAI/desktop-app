import { convertOdtToPdf } from "@/services/aymurai/queries";
import type { RichTextDocument } from "@aymurai/ui";
import { documentToOdt } from "./summary-formatters/odt";
import { documentToPlainText } from "./summary-formatters/txt";

export type SummaryExportFormat = "txt" | "odt" | "pdf";

export async function exportSummary(
  document: RichTextDocument,
  title: string,
  format: SummaryExportFormat,
): Promise<Blob> {
  if (format === "txt") {
    return new Blob([documentToPlainText(document)], { type: "text/plain" });
  }

  const odtBlob = documentToOdt(document, title);
  if (format === "odt") return odtBlob;

  return convertOdtToPdf(odtBlob);
}
