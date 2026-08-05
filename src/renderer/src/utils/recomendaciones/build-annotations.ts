import type { ExtractedValueAnnotation } from "@/components/file-annotator/types";
import type { Paragraph } from "@/types/file";
import type { RecomendacionValues } from "@/types/recomendaciones";
import { locateValue } from "./locate-value";

/**
 * Fields eligible for highlighting, in emission order. `tema`, `subtema`,
 * `destinatario.sector`, `datos_personales` and `contenido_para_publicar` are
 * classifications/LLM syntheses rather than quotations from the source
 * document, so they are intentionally excluded (see plan §5.3).
 */
function fieldsToLocate(
  values: RecomendacionValues,
): { field: string; value: string }[] {
  const fields: { field: string; value: string }[] = [
    { field: "numero_recomendacion", value: values.numero_recomendacion },
    { field: "fecha_recomendacion", value: values.fecha_recomendacion },
  ];

  for (const destinatario of values.destinatarios) {
    fields.push({
      field: `destinatario:${destinatario.id}:nombre`,
      value: destinatario.nombre,
    });
    fields.push({
      field: `destinatario:${destinatario.id}:cargo`,
      value: destinatario.cargo,
    });
  }

  return fields.filter(({ value }) => value.trim().length > 0);
}

/**
 * `generateSplits` (file-annotator) does not tolerate overlapping ranges for
 * arbitrary annotation types: its `isRightConflicting` check silently drops
 * (does not render) any token whose start falls before the end of the last
 * accepted split. Only "search"-over-"tag" overlaps get special merge
 * treatment via `mergeSearchIntoTags`; "extracted" annotations get none.
 * So overlap resolution here is load-bearing, not just defence-in-depth:
 * without it, later-emitted overlapping annotations would simply vanish
 * from the rendered document instead of being handled gracefully.
 */
function dedupeOverlaps(
  annotations: ExtractedValueAnnotation[],
): ExtractedValueAnnotation[] {
  const sorted = [...annotations].sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return b.end - b.start - (a.end - a.start);
  });

  const accepted: ExtractedValueAnnotation[] = [];
  for (const annotation of sorted) {
    const overlapsAccepted = accepted.some(
      (existing) =>
        annotation.start < existing.end && existing.start < annotation.end,
    );
    if (!overlapsAccepted) accepted.push(annotation);
  }

  return accepted.sort((a, b) => a.start - b.start);
}

/**
 * Locates each highlightable extracted-value field in the document's
 * paragraphs and turns the resulting ranges into `ExtractedValueAnnotation`s,
 * grouped by paragraph id. Within each paragraph, overlapping annotations are
 * resolved by keeping the earliest-starting (then longest) candidate and
 * dropping anything that overlaps it.
 */
export function buildExtractedAnnotations(
  values: RecomendacionValues,
  paragraphs: Paragraph[],
): Map<string, ExtractedValueAnnotation[]> {
  const byParagraph = new Map<string, ExtractedValueAnnotation[]>();

  for (const { field, value } of fieldsToLocate(values)) {
    const ranges = locateValue(value, paragraphs);
    for (const range of ranges) {
      const annotation: ExtractedValueAnnotation = {
        type: "extracted",
        paragraphId: range.paragraphId,
        start: range.start,
        end: range.end,
        field,
        variant: "value",
      };
      const existing = byParagraph.get(range.paragraphId) ?? [];
      existing.push(annotation);
      byParagraph.set(range.paragraphId, existing);
    }
  }

  const result = new Map<string, ExtractedValueAnnotation[]>();
  for (const [paragraphId, annotations] of byParagraph) {
    result.set(paragraphId, dedupeOverlaps(annotations));
  }

  return result;
}
