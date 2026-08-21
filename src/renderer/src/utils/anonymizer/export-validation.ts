import ANONYMIZER_ES from "@/constants/i18n/locales/es/anonymizer";
import type { PredictLabel } from "@/types/aymurai";
import type { DocFile, Paragraph } from "@/types/file";
// G8 F1: `AnonymizerExportValidationError`'s message used to be one hardcoded
// string ("... offsets inválidos, duplicados o solapados") for all nine issue
// codes, which is what sent the bug report chasing an unrelated question
// ("what overlap is valid?"). The message now has to be built from the
// FATAL issues actually present, which means translating from inside this
// module - the caller is `services/aymurai/queries.ts`'s `anonymize` query,
// not a React component, so there's no `useTranslation` hook available at
// either site, and pushing the translated string up through the query layer
// would require editing `queries.ts` (explicitly out of T1's scope, and this
// ticket doesn't touch it either).
//
// Two ways to get at the instance, with a real trade-off - (a1)
// `import i18n from "@/constants/i18n"` guarantees the instance is
// initialized wherever this module is imported from, but MEASURED to break
// existing tests: `constants/i18n/index.ts` calls `i18n.use(initReactI18next)
// .init(...)` as an IMPORT-TIME side effect, and several existing test files
// (file-annotator/index.test.tsx, voice-to-text/validation.test.tsx,
// routes/app.$feature/finish.test.tsx) mock `react-i18next` wholesale without
// exporting `initReactI18next` - importing the bootstrap transitively through
// this module (queries.ts -> usePredict.ts -> ... -> here) then crashes
// those mocks with "No 'initReactI18next' export is defined". (a2)
// `import i18n from "i18next"` bare, chosen here, has no such side effect: it
// depends on `main.tsx` having already initialized the singleton before any
// query runs (true in the running app). There is no precedent in this repo
// for non-React code importing the i18next instance either way; this is the
// first.
//
// CORRECTION (adversary/critic, G8 repair): the paragraph above used to claim
// that when i18n is NOT initialized, `t()` "falls back to returning the raw
// key" - that is false. Measured against `node_modules/i18next` directly:
// before `.init()` runs, `i18n.t` returns `undefined`, not the key, so
// `buildExportErrorMessage` produced `""` for one family and `" "` for
// several (`Array.prototype.join` stringifies `undefined` to `""`) - the
// export-blocked error came out BLANK, exactly the "message that lies to the
// user" defect this ticket exists to fix, just silently instead of loudly.
// Fixed by falling back to `ANONYMIZER_ES.export` (the same Spanish copy
// `t()` would resolve to once i18n IS initialized, imported directly from
// the locale data module - not `@/constants/i18n`, so no bootstrap side
// effect - whenever `i18n.t()` doesn't return a real, non-empty string.
// Regression coverage: `__tests__/export-validation-message.test.ts`,
// deliberately a separate file with no `@/constants/i18n` import, since
// vitest isolates the module registry per file and every OTHER test file in
// this repo sees the i18next singleton uninitialized exactly like this one.
import i18n from "i18next";
import { stripEntityLabelSuffix } from "./entity-similarity";

type ExportValidationIssueCode =
  | "missing_offsets"
  | "invalid_range"
  | "paragraph_not_found"
  | "range_out_of_bounds"
  | "text_mismatch"
  | "missing_canonical_entity_id"
  | "duplicate_range"
  | "overlapping_range"
  | "mixed_group_labels";

/**
 * Codes that still block export. `missing_canonical_entity_id` is
 * deliberately NOT in this list: a staging run of `docs/SIN_ANONIMIZAR.docx`
 * (125 paragraphs, full predict → disambiguate pipeline) produced 140
 * `missing_canonical_entity_id` issues out of 187 labels — the backend only
 * assigns `canonical_entity_id` to 47 of them, all `FECHA` — while zero
 * offset-shaped issues occurred. Those same 140 ungrouped labels round-tripped
 * through `/anonymizer/anonymize-document` as HTTP 200 with a valid 44283-byte
 * ODT. The field is also declared optional in the backend's own schemas
 * (`schema/predict.ts`, `schema/disambiguate.ts`, `types/aymurai.ts`), so
 * treating its absence as fatal contradicted the schema it came from. Do not
 * move this code back into `FATAL_CODES`.
 */
const FATAL_CODES: ReadonlySet<ExportValidationIssueCode> = new Set([
  "missing_offsets",
  "invalid_range",
  "paragraph_not_found",
  "range_out_of_bounds",
  "text_mismatch",
  "duplicate_range",
  "overlapping_range",
  "mixed_group_labels",
]);

export interface ExportEntityDebugInfo {
  entityId: string;
  canonicalEntityId: string | null;
  label: string;
  start: number | null;
  end: number | null;
  text: string;
  source: "manual" | "automatic";
  groupId: string | null;
  isDeleted: boolean;
  isManual: boolean;
  paragraphId: string;
}

export interface ExportValidationIssue {
  code: ExportValidationIssueCode;
  message: string;
  entity: ExportEntityDebugInfo;
  relatedEntity?: ExportEntityDebugInfo;
}

type ExportIssueFamily =
  | "invalidOffsets"
  | "duplicateRanges"
  | "overlappingRanges"
  | "textMismatch"
  | "mixedGroupLabels";

// Every FATAL_CODES entry maps to exactly one family. `missing_canonical_entity_id`
// is deliberately absent - it's not in FATAL_CODES, so it never reaches this map.
const CODE_TO_FAMILY: Partial<
  Record<ExportValidationIssueCode, ExportIssueFamily>
> = {
  missing_offsets: "invalidOffsets",
  invalid_range: "invalidOffsets",
  paragraph_not_found: "invalidOffsets",
  range_out_of_bounds: "invalidOffsets",
  text_mismatch: "textMismatch",
  duplicate_range: "duplicateRanges",
  overlapping_range: "overlappingRanges",
  mixed_group_labels: "mixedGroupLabels",
};

// Derives the message from the families actually present among the FATAL
// issues passed in - never from the full issue list, and never a single
// string for all nine codes. A `text_mismatch`-only failure must not mention
// overlaps, and vice versa. `generic` is a defensive fallback for the case
// (not expected to occur, since every FATAL_CODES entry has an entry above)
// where no issue maps to a known family.
//
// `translateFamily` never returns blank: `i18n.t()` returns `undefined`
// (not the raw key) when i18n hasn't been initialized yet, so any caller
// that hits this module before `main.tsx` has run `@/constants/i18n`'s
// `.init()` - every vitest file except this module's own `.test.ts`, which
// opts in explicitly - falls back to `ANONYMIZER_ES.export`, the exact same
// Spanish copy `t()` resolves to once i18n IS initialized.
function translateFamily(key: keyof typeof ANONYMIZER_ES.export): string {
  const translated = i18n.t(`anonymizer:export.${key}`);
  return typeof translated === "string" && translated.length > 0
    ? translated
    : ANONYMIZER_ES.export[key];
}

function buildExportErrorMessage(fatalIssues: ExportValidationIssue[]): string {
  const families = new Set<ExportIssueFamily>();
  for (const fatalIssue of fatalIssues) {
    const family = CODE_TO_FAMILY[fatalIssue.code];
    if (family) families.add(family);
  }

  if (families.size === 0) {
    return translateFamily("generic");
  }

  return [...families].map((family) => translateFamily(family)).join(" ");
}

export class AnonymizerExportValidationError extends Error {
  issues: ExportValidationIssue[];

  constructor(issues: ExportValidationIssue[]) {
    super(buildExportErrorMessage(issues));
    this.name = "AnonymizerExportValidationError";
    this.issues = issues;
  }
}

function buildDebugInfo(prediction: PredictLabel): ExportEntityDebugInfo {
  const isManual = !prediction.attrs.aymurai_disambiguation;
  return {
    entityId: prediction.mentionId,
    canonicalEntityId: prediction.attrs.canonical_entity_id ?? null,
    label: String(prediction.attrs.aymurai_label),
    start: Number.isFinite(prediction.start_char)
      ? prediction.start_char
      : null,
    end: Number.isFinite(prediction.end_char) ? prediction.end_char : null,
    text: prediction.text,
    source: isManual ? "manual" : "automatic",
    groupId: prediction.attrs.canonical_entity_id ?? null,
    isDeleted: false,
    isManual,
    paragraphId: prediction.paragraphId,
  };
}

function issue(
  code: ExportValidationIssueCode,
  message: string,
  entity: PredictLabel,
  relatedEntity?: PredictLabel,
): ExportValidationIssue {
  return {
    code,
    message,
    entity: buildDebugInfo(entity),
    ...(relatedEntity && { relatedEntity: buildDebugInfo(relatedEntity) }),
  };
}

function paragraphById(file: DocFile): Map<string, Paragraph> {
  return new Map(
    (file.paragraphs ?? []).map((paragraph) => [paragraph.id, paragraph]),
  );
}

function validateGroupLabels(labels: PredictLabel[]): ExportValidationIssue[] {
  const issues: ExportValidationIssue[] = [];
  const groupLabels = new Map<string, { label: string; first: PredictLabel }>();

  for (const label of labels) {
    const canonicalId = label.attrs.canonical_entity_id;
    if (!canonicalId) continue;

    const baseLabel = stripEntityLabelSuffix(String(label.attrs.aymurai_label));
    const existing = groupLabels.get(canonicalId);
    if (!existing) {
      groupLabels.set(canonicalId, { label: baseLabel, first: label });
      continue;
    }

    if (existing.label !== baseLabel) {
      issues.push(
        issue(
          "mixed_group_labels",
          `El grupo ${canonicalId} contiene labels incompatibles: ${existing.label} y ${baseLabel}.`,
          label,
          existing.first,
        ),
      );
    }
  }

  return issues;
}

function validateParagraphRanges(
  paragraph: Paragraph,
  labels: PredictLabel[],
): ExportValidationIssue[] {
  const issues: ExportValidationIssue[] = [];
  const sorted = [...labels].sort((a, b) => {
    if (a.start_char !== b.start_char) return a.start_char - b.start_char;
    return b.end_char - a.end_char;
  });
  const rangeOwners = new Map<string, PredictLabel>();
  let previous: PredictLabel | null = null;

  for (const label of sorted) {
    const key = `${label.start_char}:${label.end_char}`;
    const duplicate = rangeOwners.get(key);
    if (duplicate) {
      issues.push(
        issue(
          "duplicate_range",
          `Hay más de una entidad activa en el rango ${key}.`,
          label,
          duplicate,
        ),
      );
    } else {
      rangeOwners.set(key, label);
    }

    const textAtRange = paragraph.value.slice(label.start_char, label.end_char);
    if (textAtRange !== label.text) {
      issues.push(
        issue(
          "text_mismatch",
          "El texto de la entidad no coincide con el texto original en sus offsets.",
          label,
        ),
      );
    }

    if (previous && label.start_char < previous.end_char) {
      issues.push(
        issue(
          "overlapping_range",
          "Hay entidades activas con rangos solapados.",
          label,
          previous,
        ),
      );
    }

    if (!previous || label.end_char > previous.end_char) previous = label;
  }

  return issues;
}

export function validateAnonymizerExportState(
  file: DocFile,
  labels: PredictLabel[],
): ExportValidationIssue[] {
  const issues: ExportValidationIssue[] = [];
  const paragraphs = paragraphById(file);
  const labelsByParagraph = new Map<string, PredictLabel[]>();

  for (const label of labels) {
    const paragraph = paragraphs.get(label.paragraphId);

    if (
      !Number.isFinite(label.start_char) ||
      !Number.isFinite(label.end_char)
    ) {
      issues.push(
        issue("missing_offsets", "La entidad no tiene offsets válidos.", label),
      );
      continue;
    }

    if (label.start_char >= label.end_char) {
      issues.push(
        issue(
          "invalid_range",
          "La entidad tiene start mayor o igual a end.",
          label,
        ),
      );
      continue;
    }

    if (!paragraph) {
      issues.push(
        issue(
          "paragraph_not_found",
          "La entidad apunta a un párrafo inexistente.",
          label,
        ),
      );
      continue;
    }

    if (label.start_char < 0 || label.end_char > paragraph.value.length) {
      issues.push(
        issue(
          "range_out_of_bounds",
          "La entidad tiene offsets fuera del texto original.",
          label,
        ),
      );
      continue;
    }

    if (!label.attrs.canonical_entity_id) {
      issues.push(
        issue(
          "missing_canonical_entity_id",
          "La entidad activa no tiene canonical_entity_id.",
          label,
        ),
      );
    }

    const paragraphLabels = labelsByParagraph.get(label.paragraphId) ?? [];
    paragraphLabels.push(label);
    labelsByParagraph.set(label.paragraphId, paragraphLabels);
  }

  for (const [paragraphId, paragraphLabels] of labelsByParagraph) {
    const paragraph = paragraphs.get(paragraphId);
    if (!paragraph) continue;
    issues.push(...validateParagraphRanges(paragraph, paragraphLabels));
  }

  issues.push(...validateGroupLabels(labels));

  return issues;
}

function issuesByCode(issues: ExportValidationIssue[]): Record<string, number> {
  return issues.reduce<Record<string, number>>((acc, i) => {
    acc[i.code] = (acc[i.code] ?? 0) + 1;
    return acc;
  }, {});
}

export function assertValidAnonymizerExportState(
  file: DocFile,
  labels: PredictLabel[],
) {
  const issues = validateAnonymizerExportState(file, labels);
  if (issues.length === 0) return;

  const fatalIssues = issues.filter((i) => FATAL_CODES.has(i.code));
  const nonFatalIssues = issues.filter((i) => !FATAL_CODES.has(i.code));

  if (nonFatalIssues.length > 0) {
    console.warn("Non-fatal anonymizer export annotations", {
      fileName: file.data.name,
      issueSummary: issuesByCode(nonFatalIssues),
      issues: nonFatalIssues,
    });
  }

  if (fatalIssues.length === 0) return;

  // Group issues by code so a quick console.table() is readable.
  console.error("Invalid anonymizer export annotations", {
    fileName: file.data.name,
    issueSummary: issuesByCode(fatalIssues),
    issues: fatalIssues,
  });
  console.table(
    fatalIssues.map((i) => ({
      code: i.code,
      paragraphId:
        i.entity.paragraphId.length > 40
          ? `${i.entity.paragraphId.slice(0, 40)}…`
          : i.entity.paragraphId,
      label: i.entity.label,
      start: i.entity.start,
      end: i.entity.end,
      text: i.entity.text,
    })),
  );
  throw new AnonymizerExportValidationError(fatalIssues);
}
