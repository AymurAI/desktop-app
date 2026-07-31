// Adversary (G8 F1). Companion to export-validation.test.ts, and the reason
// it is a SEPARATE file: that one opens with `import "@/constants/i18n"`, so
// the i18next singleton is initialized for every test in it. Vitest isolates
// the module registry per file, so EVERY OTHER test file in this repo - and
// any future non-app consumer of this module - sees the singleton
// UNinitialized, which is the state this file deliberately reproduces. It
// therefore imports the module under test and nothing else: adding an
// `@/constants/i18n` import here would destroy the very condition it exists
// to cover.
//
// export-validation.ts justifies reading the bare `i18next` package (instead
// of `@/constants/i18n`) with this claim: "in an isolated vitest file that
// imports only this module (not the app's bootstrap chain), `t()` falls back
// to returning the raw key". That claim is false. Measured against
// node_modules/i18next: before `init()`, `I18n.prototype.t` returns
// `undefined` (the translator does not exist yet), so
// `buildExportErrorMessage` produces `""` for one issue family and `" "` for
// several - `[undefined, undefined].join(" ")` is a single space, because
// Array.prototype.join stringifies undefined to "". The user-facing message
// this whole ticket exists to make truthful comes out BLANK, not as a
// debuggable raw key.
//
// In the shipped app the blank message is masked by `main.tsx:6` importing
// `./constants/i18n` above `./app`, and nothing asserts that ordering. These
// cases pin the invariant that actually matters - a user-facing error message
// is never blank - so it holds regardless of who initialized what first.
import { describe, expect, it } from "vitest";
import {
  AnonymizerExportValidationError,
  type ExportValidationIssue,
} from "../export-validation";

function makeIssue(code: ExportValidationIssue["code"]): ExportValidationIssue {
  return {
    code,
    message: `synthetic ${code}`,
    entity: {
      entityId: `e-${code}`,
      canonicalEntityId: null,
      label: "PER",
      start: 0,
      end: 11,
      text: "Juana Pérez",
      source: "automatic",
      groupId: null,
      isDeleted: false,
      isManual: false,
      paragraphId: "p1",
    },
  };
}

describe("AnonymizerExportValidationError message (i18n not initialized)", () => {
  it("is never blank for a single issue family", () => {
    const error = new AnonymizerExportValidationError([
      makeIssue("text_mismatch"),
    ]);

    expect(error.message.trim()).not.toBe("");
    expect(error.message).not.toContain("undefined");
  });

  it("is never blank for several issue families", () => {
    // The insidious shape: two unresolved keys joined by a space yield " ",
    // which is truthy and non-zero-length, so any guard looser than a
    // trimmed check would wave it through.
    const error = new AnonymizerExportValidationError([
      makeIssue("text_mismatch"),
      makeIssue("overlapping_range"),
      makeIssue("duplicate_range"),
    ]);

    expect(error.message.trim()).not.toBe("");
    expect(error.message).not.toContain("undefined");
  });

  it("is never blank on the generic fallback path (no issue maps to a family)", () => {
    // `missing_canonical_entity_id` is deliberately not in FATAL_CODES and
    // has no family, so this is the `families.size === 0` branch.
    const error = new AnonymizerExportValidationError([
      makeIssue("missing_canonical_entity_id"),
    ]);

    expect(error.message.trim()).not.toBe("");
    expect(error.message).not.toContain("undefined");
  });
});
