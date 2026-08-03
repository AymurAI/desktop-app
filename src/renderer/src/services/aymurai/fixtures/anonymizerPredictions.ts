import type { PredictLabel } from "@/types/aymurai";
import type { Paragraph } from "@/types/file";

/**
 * Trimmed-down snapshot captured from a real staging run (2026-07-31,
 * `aymurai.staging.collectiveai.io`, `/anonymizer/predict` +
 * `/anonymizer/disambiguate`) against `docs/SIN_ANONIMIZAR.docx`.
 *
 * The full document produced 187 labels, 140 of which came back from
 * disambiguate with `aymurai_disambiguation: "fuzzy"` and NO
 * `canonical_entity_id` — the backend only assigned one to 47 labels, all
 * `FECHA`. This fixture keeps that same shape at reproduction-minimum size:
 * every `PER` mention below has no `canonical_entity_id` (the normal,
 * disambiguated-but-not-grouped case for this document) while every `FECHA`
 * mention has one. Sending the equivalent 140 ungrouped labels to
 * `/anonymizer/anonymize-document` returned HTTP 200 with a valid 44283-byte
 * ODT, which is the case this fixture exists to keep exercising: it must
 * report `missing_canonical_entity_id` without ever becoming fatal.
 *
 * If the backend starts assigning ids to every label, this fixture (and the
 * regression test built on it) stop being a faithful reproduction — update
 * both from a fresh staging capture rather than hand-editing the ids in.
 */

export const ANONYMIZER_FIXTURE_PARAGRAPHS: Paragraph[] = [
  {
    id: "para-1",
    document_id: "doc-1",
    value:
      "El Sr. Juan Pérez se presentó el 12 de marzo de 2024 en la comisaría de la Ciudad de Buenos Aires.",
  },
  {
    id: "para-2",
    document_id: "doc-1",
    value:
      "La Sra. Ana Gómez declaró junto a Juan Pérez y Pedro López el 15 de marzo de 2024 en presencia del Dr. Carlos Ruiz.",
  },
  {
    id: "para-3",
    document_id: "doc-1",
    value: "El domicilio fue verificado el 20 de marzo de 2024.",
  },
];

function buildLabel(
  overrides: Pick<
    PredictLabel,
    "mentionId" | "paragraphId" | "text" | "start_char" | "end_char"
  > & {
    label: "PER" | "FECHA";
    canonicalEntityId: string | null;
  },
): PredictLabel {
  const { label, canonicalEntityId, ...rest } = overrides;
  return {
    ...rest,
    attrs: {
      aymurai_label: label,
      aymurai_label_subclass: null,
      aymurai_alt_text: null,
      aymurai_alt_start_char: null,
      aymurai_alt_end_char: null,
      canonical_entity_id: canonicalEntityId,
      aymurai_anonymize: true,
      aymurai_label_instance: null,
      aymurai_disambiguation: canonicalEntityId ? "exact" : "fuzzy",
    },
  };
}

export const ANONYMIZER_FIXTURE_LABELS: PredictLabel[] = [
  buildLabel({
    mentionId: "mention-1",
    paragraphId: "para-1",
    text: "Juan Pérez",
    start_char: 7,
    end_char: 17,
    label: "PER",
    canonicalEntityId: null,
  }),
  buildLabel({
    mentionId: "mention-2",
    paragraphId: "para-1",
    text: "12 de marzo de 2024",
    start_char: 33,
    end_char: 52,
    label: "FECHA",
    canonicalEntityId: "fecha-canonical-1",
  }),
  buildLabel({
    mentionId: "mention-3",
    paragraphId: "para-2",
    text: "Ana Gómez",
    start_char: 8,
    end_char: 17,
    label: "PER",
    canonicalEntityId: null,
  }),
  buildLabel({
    mentionId: "mention-4",
    paragraphId: "para-2",
    text: "Juan Pérez",
    start_char: 34,
    end_char: 44,
    label: "PER",
    canonicalEntityId: null,
  }),
  buildLabel({
    mentionId: "mention-5",
    paragraphId: "para-2",
    text: "Pedro López",
    start_char: 47,
    end_char: 58,
    label: "PER",
    canonicalEntityId: null,
  }),
  buildLabel({
    mentionId: "mention-6",
    paragraphId: "para-2",
    text: "15 de marzo de 2024",
    start_char: 62,
    end_char: 81,
    label: "FECHA",
    canonicalEntityId: "fecha-canonical-2",
  }),
  buildLabel({
    mentionId: "mention-7",
    paragraphId: "para-2",
    text: "Carlos Ruiz",
    start_char: 103,
    end_char: 114,
    label: "PER",
    canonicalEntityId: null,
  }),
  buildLabel({
    mentionId: "mention-8",
    paragraphId: "para-3",
    text: "20 de marzo de 2024",
    start_char: 31,
    end_char: 50,
    label: "FECHA",
    canonicalEntityId: "fecha-canonical-3",
  }),
];
