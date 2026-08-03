// G8 F1: export-validation.ts reads the i18next instance via the bare
// `i18next` package (not `@/constants/i18n`) precisely so importing it
// doesn't force-initialize i18n as a side effect (that broke OTHER test
// files that mock `react-i18next` wholesale - see export-validation.ts's
// comment). That means THIS test file has to initialize i18n itself to
// exercise the real resolved-message path instead of asserting on raw
// keys - importing the bootstrap module is a side-effect-only import.
import "@/constants/i18n";
import {
  ANONYMIZER_FIXTURE_LABELS,
  ANONYMIZER_FIXTURE_PARAGRAPHS,
} from "@/services/aymurai/fixtures/anonymizerPredictions";
import type { PredictLabel } from "@/types/aymurai";
import type { DocFile, Paragraph } from "@/types/file";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AnonymizerExportValidationError,
  assertValidAnonymizerExportState,
  validateAnonymizerExportState,
} from "../export-validation";

function makeParagraph(overrides: Partial<Paragraph> = {}): Paragraph {
  return {
    id: "p1",
    document_id: "doc-1",
    value: "ABCDEFGHIJKLMNOPQRST",
    ...overrides,
  };
}

function makeFile(overrides: Partial<DocFile> = {}): DocFile {
  return {
    data: new File(["contenido"], "documento.docx"),
    paragraphs: [makeParagraph()],
    selected: true,
    validationObject: {},
    ...overrides,
  };
}

// Minimal factory — only the fields the validator inspects.
function makeLabel(
  overrides: Partial<PredictLabel> & { label?: string } = {},
): PredictLabel {
  const { label = "PER", ...rest } = overrides;
  return {
    mentionId: "mention-1",
    paragraphId: "p1",
    text: "ABCDEFGHIJ",
    start_char: 0,
    end_char: 10,
    attrs: {
      aymurai_label: label as PredictLabel["attrs"]["aymurai_label"],
      aymurai_label_subclass: null,
      aymurai_alt_text: null,
      aymurai_alt_start_char: null,
      aymurai_alt_end_char: null,
      canonical_entity_id: "canonical-1",
      aymurai_anonymize: true,
      aymurai_label_instance: null,
      aymurai_disambiguation: "exact",
    },
    ...rest,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

// ────────────────────────────────────────────────────────────────────────────
// F1 regression: missing_canonical_entity_id is reported but not fatal
// ────────────────────────────────────────────────────────────────────────────
describe("missing_canonical_entity_id (real staging fixture)", () => {
  it("validateAnonymizerExportState still reports missing_canonical_entity_id", () => {
    const file = makeFile({ paragraphs: ANONYMIZER_FIXTURE_PARAGRAPHS });
    const issues = validateAnonymizerExportState(
      file,
      ANONYMIZER_FIXTURE_LABELS,
    );

    const missingIdIssues = issues.filter(
      (i) => i.code === "missing_canonical_entity_id",
    );
    // 5 PER mentions in the fixture have no canonical_entity_id.
    expect(missingIdIssues.length).toBe(5);
    expect(issues.some((i) => i.code !== "missing_canonical_entity_id")).toBe(
      false,
    );
  });

  it("assertValidAnonymizerExportState does NOT throw", () => {
    const file = makeFile({ paragraphs: ANONYMIZER_FIXTURE_PARAGRAPHS });

    expect(() =>
      assertValidAnonymizerExportState(file, ANONYMIZER_FIXTURE_LABELS),
    ).not.toThrow();
  });

  it("logs the non-fatal issues via console.warn with a per-code count", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const file = makeFile({ paragraphs: ANONYMIZER_FIXTURE_PARAGRAPHS });

    assertValidAnonymizerExportState(file, ANONYMIZER_FIXTURE_LABELS);

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const [, payload] = warnSpy.mock.calls[0];
    expect(payload).toMatchObject({
      issueSummary: { missing_canonical_entity_id: 5 },
    });
    expect(errorSpy).not.toHaveBeenCalled();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Every remaining fatal code still throws
// ────────────────────────────────────────────────────────────────────────────
describe("fatal codes still throw", () => {
  it("missing_offsets", () => {
    const file = makeFile();
    const label = makeLabel({ start_char: Number.NaN, end_char: 10 });

    expect(() => assertValidAnonymizerExportState(file, [label])).toThrow();
    const issues = validateAnonymizerExportState(file, [label]);
    expect(issues.map((i) => i.code)).toContain("missing_offsets");
  });

  it("invalid_range", () => {
    const file = makeFile();
    const label = makeLabel({ start_char: 10, end_char: 5 });

    expect(() => assertValidAnonymizerExportState(file, [label])).toThrow();
    const issues = validateAnonymizerExportState(file, [label]);
    expect(issues.map((i) => i.code)).toContain("invalid_range");
  });

  it("paragraph_not_found", () => {
    const file = makeFile({ paragraphs: [makeParagraph({ id: "other" })] });
    const label = makeLabel({ paragraphId: "missing-paragraph" });

    expect(() => assertValidAnonymizerExportState(file, [label])).toThrow();
    const issues = validateAnonymizerExportState(file, [label]);
    expect(issues.map((i) => i.code)).toContain("paragraph_not_found");
  });

  it("range_out_of_bounds", () => {
    const file = makeFile({ paragraphs: [makeParagraph({ value: "ABCDE" })] });
    const label = makeLabel({ start_char: 0, end_char: 10, text: "ABCDE" });

    expect(() => assertValidAnonymizerExportState(file, [label])).toThrow();
    const issues = validateAnonymizerExportState(file, [label]);
    expect(issues.map((i) => i.code)).toContain("range_out_of_bounds");
  });

  it("text_mismatch", () => {
    const file = makeFile({ paragraphs: [makeParagraph({ value: "ABCDE" })] });
    const label = makeLabel({ start_char: 0, end_char: 3, text: "XYZ" });

    expect(() => assertValidAnonymizerExportState(file, [label])).toThrow();
    const issues = validateAnonymizerExportState(file, [label]);
    expect(issues.map((i) => i.code)).toContain("text_mismatch");
  });

  it("duplicate_range", () => {
    const paragraph = makeParagraph({ value: "Juan Pérez Juan Pérez" });
    const file = makeFile({ paragraphs: [paragraph] });
    const labelA = makeLabel({
      mentionId: "mention-a",
      start_char: 0,
      end_char: 10,
      text: "Juan Pérez",
    });
    const labelB = makeLabel({
      mentionId: "mention-b",
      start_char: 0,
      end_char: 10,
      text: "Juan Pérez",
    });

    expect(() =>
      assertValidAnonymizerExportState(file, [labelA, labelB]),
    ).toThrow();
    const issues = validateAnonymizerExportState(file, [labelA, labelB]);
    expect(issues.map((i) => i.code)).toContain("duplicate_range");
  });

  it("overlapping_range", () => {
    const paragraph = makeParagraph({ value: "ABCDEFGHIJKLMNO" });
    const file = makeFile({ paragraphs: [paragraph] });
    const labelA = makeLabel({
      mentionId: "mention-a",
      start_char: 0,
      end_char: 10,
      text: "ABCDEFGHIJ",
    });
    const labelB = makeLabel({
      mentionId: "mention-b",
      start_char: 5,
      end_char: 15,
      text: "FGHIJKLMNO",
    });

    expect(() =>
      assertValidAnonymizerExportState(file, [labelA, labelB]),
    ).toThrow();
    const issues = validateAnonymizerExportState(file, [labelA, labelB]);
    expect(issues.map((i) => i.code)).toContain("overlapping_range");
  });

  it("mixed_group_labels", () => {
    const paragraph = makeParagraph({ value: "ABCDEFGHIJKLMNOPQRST" });
    const file = makeFile({ paragraphs: [paragraph] });
    const labelA = makeLabel({
      mentionId: "mention-a",
      label: "PER",
      start_char: 0,
      end_char: 10,
      text: "ABCDEFGHIJ",
      attrs: {
        ...makeLabel().attrs,
        aymurai_label: "PER",
        canonical_entity_id: "shared-canonical",
      },
    });
    const labelB = makeLabel({
      mentionId: "mention-b",
      label: "FECHA",
      start_char: 10,
      end_char: 20,
      text: "KLMNOPQRST",
      attrs: {
        ...makeLabel().attrs,
        aymurai_label: "FECHA",
        canonical_entity_id: "shared-canonical",
      },
    });

    expect(() =>
      assertValidAnonymizerExportState(file, [labelA, labelB]),
    ).toThrow();
    const issues = validateAnonymizerExportState(file, [labelA, labelB]);
    expect(issues.map((i) => i.code)).toContain("mixed_group_labels");
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Sad paths
// ────────────────────────────────────────────────────────────────────────────
describe("sad paths", () => {
  it("labels: [] does not throw", () => {
    const file = makeFile();
    expect(() => assertValidAnonymizerExportState(file, [])).not.toThrow();
  });

  it("file.paragraphs: undefined does not throw when there are no labels", () => {
    const file = makeFile({ paragraphs: undefined });
    expect(() => assertValidAnonymizerExportState(file, [])).not.toThrow();
  });

  it("a label pointing to a nonexistent paragraphId DOES throw", () => {
    const file = makeFile({ paragraphs: undefined });
    const label = makeLabel({ paragraphId: "nonexistent-paragraph" });

    expect(() => assertValidAnonymizerExportState(file, [label])).toThrow();
    const issues = validateAnonymizerExportState(file, [label]);
    expect(issues.map((i) => i.code)).toContain("paragraph_not_found");
  });
});

// ────────────────────────────────────────────────────────────────────────────
// G8 F1: the error message names only the family that actually blocked the
// export, and it's real translated Spanish - not a single hardcoded string
// for all nine codes, and not a raw i18next key.
// ────────────────────────────────────────────────────────────────────────────
describe("export error message (G8 F1)", () => {
  // Distinguishing substrings from constants/i18n/locales/es/anonymizer.ts's
  // `export.*` keys - each appears in exactly one family's message.
  const FAMILY_MARKERS = {
    invalidOffsets: "offsets inválidos",
    duplicateRanges: "mismo tramo",
    overlappingRanges: "solapados",
    textMismatch: "no coincide",
    mixedGroupLabels: "incompatibles",
  } as const;

  function otherMarkers(own: keyof typeof FAMILY_MARKERS): string[] {
    return Object.entries(FAMILY_MARKERS)
      .filter(([family]) => family !== own)
      .map(([, marker]) => marker);
  }

  function messageFromThrow(file: DocFile, labels: PredictLabel[]): string {
    try {
      assertValidAnonymizerExportState(file, labels);
    } catch (error) {
      if (error instanceof AnonymizerExportValidationError) {
        return error.message;
      }
      throw error;
    }
    throw new Error("expected assertValidAnonymizerExportState to throw");
  }

  it("resolves to real Spanish text, not a raw i18next key", () => {
    const file = makeFile();
    const label = makeLabel({ start_char: Number.NaN, end_char: 10 });

    const message = messageFromThrow(file, [label]);

    // The failure mode this criterion guards against: a message that reads
    // "anonymizer:export.invalidOffsets" instead of the translated text.
    expect(message).not.toMatch(/anonymizer:/);
    expect(message).toContain(FAMILY_MARKERS.invalidOffsets);
  });

  it("invalid offsets (missing_offsets) names only that family", () => {
    const file = makeFile();
    const label = makeLabel({ start_char: Number.NaN, end_char: 10 });

    const message = messageFromThrow(file, [label]);

    expect(message).toContain(FAMILY_MARKERS.invalidOffsets);
    for (const other of otherMarkers("invalidOffsets")) {
      expect(message).not.toContain(other);
    }
  });

  it("duplicate ranges names that family (and, correctly, overlapping ranges too - two identical-range labels are structurally both at once)", () => {
    const paragraph = makeParagraph({ value: "Juan Pérez Juan Pérez" });
    const file = makeFile({ paragraphs: [paragraph] });
    const labelA = makeLabel({
      mentionId: "mention-a",
      start_char: 0,
      end_char: 10,
      text: "Juan Pérez",
    });
    const labelB = makeLabel({
      mentionId: "mention-b",
      start_char: 0,
      end_char: 10,
      text: "Juan Pérez",
    });

    const message = messageFromThrow(file, [labelA, labelB]);

    // Two labels sharing the exact same start/end are, by this validator's
    // (frozen, unrelated-to-this-ticket) logic, BOTH a duplicate_range AND an
    // overlapping_range - the second label's start never fails to be "less
    // than" the first's end when the ranges are identical. So both families
    // genuinely blocked this export, and the message is correct to name
    // both; the exclusivity guarantee is that it does NOT name the two
    // families that had nothing to do with this failure.
    expect(message).toContain(FAMILY_MARKERS.duplicateRanges);
    expect(message).toContain(FAMILY_MARKERS.overlappingRanges);
    expect(message).not.toContain(FAMILY_MARKERS.invalidOffsets);
    expect(message).not.toContain(FAMILY_MARKERS.textMismatch);
    expect(message).not.toContain(FAMILY_MARKERS.mixedGroupLabels);
  });

  it("overlapping ranges names only that family", () => {
    const paragraph = makeParagraph({ value: "ABCDEFGHIJKLMNO" });
    const file = makeFile({ paragraphs: [paragraph] });
    const labelA = makeLabel({
      mentionId: "mention-a",
      start_char: 0,
      end_char: 10,
      text: "ABCDEFGHIJ",
    });
    const labelB = makeLabel({
      mentionId: "mention-b",
      start_char: 5,
      end_char: 15,
      text: "FGHIJKLMNO",
    });

    const message = messageFromThrow(file, [labelA, labelB]);

    expect(message).toContain(FAMILY_MARKERS.overlappingRanges);
    for (const other of otherMarkers("overlappingRanges")) {
      expect(message).not.toContain(other);
    }
  });

  it("text mismatch names only that family - not overlaps", () => {
    const file = makeFile({ paragraphs: [makeParagraph({ value: "ABCDE" })] });
    const label = makeLabel({ start_char: 0, end_char: 3, text: "XYZ" });

    const message = messageFromThrow(file, [label]);

    expect(message).toContain(FAMILY_MARKERS.textMismatch);
    for (const other of otherMarkers("textMismatch")) {
      expect(message).not.toContain(other);
    }
  });

  it("mixed group labels names only that family", () => {
    const paragraph = makeParagraph({ value: "ABCDEFGHIJKLMNOPQRST" });
    const file = makeFile({ paragraphs: [paragraph] });
    const labelA = makeLabel({
      mentionId: "mention-a",
      label: "PER",
      start_char: 0,
      end_char: 10,
      text: "ABCDEFGHIJ",
      attrs: {
        ...makeLabel().attrs,
        aymurai_label: "PER",
        canonical_entity_id: "shared-canonical",
      },
    });
    const labelB = makeLabel({
      mentionId: "mention-b",
      label: "FECHA",
      start_char: 10,
      end_char: 20,
      text: "KLMNOPQRST",
      attrs: {
        ...makeLabel().attrs,
        aymurai_label: "FECHA",
        canonical_entity_id: "shared-canonical",
      },
    });

    const message = messageFromThrow(file, [labelA, labelB]);

    expect(message).toContain(FAMILY_MARKERS.mixedGroupLabels);
    for (const other of otherMarkers("mixedGroupLabels")) {
      expect(message).not.toContain(other);
    }
  });
});
