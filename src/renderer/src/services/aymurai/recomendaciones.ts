import { CanceledError } from "axios";

import {
  type RecomendacionDocument,
  type RecomendacionValidation,
  dataExtractionResultSchema,
  recomendacionDocumentSchema,
} from "@/schema/recomendaciones";
import type { DataExtractionResult } from "@/types/recomendaciones";
import api from "../api";

const VALIDATION_PATH = "/llm/recomendaciones/validation/document";

/**
 * Sends the document to the backend LLM extraction endpoint.
 * Errors are NOT swallowed here: a failed extraction is a real failure the UI
 * should surface (e.g. with a retry action), unlike `loadRecomendacion` which
 * degrades gracefully.
 */
export async function extractRecomendacion(
  documentId: string,
  paragraphs: string[],
  signal?: AbortSignal,
): Promise<DataExtractionResult> {
  const response = await api.post(
    "/llm/data-extraction",
    { document: { document_id: documentId, document: paragraphs } },
    { signal },
  );
  return dataExtractionResultSchema.parse(response.data);
}

/**
 * Retrieves whatever has been persisted for this document (prior inference
 * and/or manual validation).
 *
 * Return values:
 * - `RecomendacionDocument` → stored document found; use it to seed the UI.
 * - `null`                  → nothing usable is stored; caller should fall
 *   back to running a fresh extraction.
 *
 * On an aborted request (`CanceledError`) the error is re-thrown so React
 * Query can clean up properly — swallowing it into `null` would make the
 * caller believe nothing is stored and trigger a spurious, expensive LLM
 * extraction.
 *
 * Every OTHER error (404, 405, 501, network failure, malformed body) returns
 * `null` so the flow degrades to a fresh extraction. This is deliberate: the
 * persistence endpoint does not exist on the backend yet, so this client must
 * tolerate its absence.
 */
export async function loadRecomendacion(
  documentId: string,
  signal?: AbortSignal,
): Promise<RecomendacionDocument | null> {
  try {
    const response = await api.get(`${VALIDATION_PATH}/${documentId}`, {
      signal,
    });
    if (!response.data) return null;
    return recomendacionDocumentSchema.parse(response.data);
  } catch (e) {
    // Propagate request cancellations so React Query can clean up properly.
    if (e instanceof CanceledError) throw e;

    // Any other error (endpoint unavailable, unexpected schema, etc.): fail
    // open and let the caller fall back to a fresh extraction.
    return null;
  }
}

/**
 * Persists the human-validated recomendación for this document.
 */
export async function saveRecomendacion(
  documentId: string,
  validation: RecomendacionValidation,
  signal?: AbortSignal,
): Promise<void> {
  await api.post(`${VALIDATION_PATH}/${documentId}`, validation, { signal });
}
