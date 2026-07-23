import type {
  SummaryValidation,
  SummaryValidationClient,
} from "./summaryValidation";

const STORAGE_PREFIX = "summary-validation:";

export const noopSummaryValidationClient: SummaryValidationClient = {
  async save(summary) {
    localStorage.setItem(
      `${STORAGE_PREFIX}${summary.documentId}`,
      JSON.stringify(summary),
    );
  },
  async load(documentId) {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${documentId}`);
    return raw ? (JSON.parse(raw) as SummaryValidation) : null;
  },
};
