import api from "../api";

export interface SummaryValidation {
  documentId: string;
  title: string;
  generatedSummary: string;
  editedSummary: string;
}

export interface SummaryValidationClient {
  save(summary: SummaryValidation, signal?: AbortSignal): Promise<void>;
  load(
    documentId: string,
    signal?: AbortSignal,
  ): Promise<SummaryValidation | null>;
}

/**
 * Real backend-backed implementation, written against the anticipated
 * `/summary/validation/document/:id` route (mirrors asrValidation.ts's
 * `/asr/validation/document/:id`). The route does not exist server-side yet —
 * see docs/superpowers/specs/2026-07-22-resumen-de-documento-design.md.
 */
export const backendSummaryValidationClient: SummaryValidationClient = {
  async save(summary, signal) {
    await api.post(
      `/summary/validation/document/${summary.documentId}`,
      {
        title: summary.title,
        generated_summary: summary.generatedSummary,
        edited_summary: summary.editedSummary,
      },
      { signal },
    );
  },
  async load(documentId, signal) {
    const response = await api.get(
      `/summary/validation/document/${documentId}`,
      { signal },
    );
    return response.data ?? null;
  },
};
