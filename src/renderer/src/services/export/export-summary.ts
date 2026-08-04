import { convertOdtToPdf } from "@/services/aymurai/queries";
import type { JSONContent } from "@aymurai/ui";
import { documentToOdt } from "./summary-formatters/odt";
import { documentToPlainText } from "./summary-formatters/txt";

export type SummaryExportFormat = "txt" | "odt" | "pdf";

export async function exportSummary(
  document: JSONContent,
  title: string,
  format: SummaryExportFormat,
): Promise<Blob> {
  if (format === "txt") {
    return new Blob([documentToPlainText(document, title)], {
      type: "text/plain",
    });
  }

  const odtBlob = await documentToOdt(document, title);
  if (format === "odt") return odtBlob;

  return convertOdtToPdf(odtBlob);
}
