import { useEffect, useRef } from "react";

import { normalizeExtraction } from "@/hooks/useRecomendacionForm";
import { setRecomendacion } from "@/reducers/file/actions";
import type { RecomendacionValidation } from "@/schema/recomendaciones";
import api from "@/services/api";
import {
  extractRecomendacion,
  loadRecomendacion,
} from "@/services/aymurai/recomendaciones";
import type { DocFile } from "@/types/file";
import type {
  DataExtractionResult,
  RecomendacionValues,
} from "@/types/recomendaciones";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useFileDispatch } from "./useFiles";

export type DataExtractionStatus = "idle" | "loading" | "ready" | "error";

interface DataExtractionResultShape {
  status: DataExtractionStatus;
  error: Error | null;
  retry: () => void;
  /**
   * Cancels the in-flight GET and/or extraction POST. Not part of the
   * original interface contract, added so the process screen's Stop button
   * can actually do something instead of orphaning the request.
   */
  abort: () => void;
}

/**
 * Adapts a persisted validation (which never carries organigram candidates)
 * into the shape `normalizeExtraction` expects, so both `prediction` and
 * `validation` can share the same normalization path. The `candidatos_*`
 * arrays are always empty here — real candidates only ever come from a
 * `prediction`.
 */
function asExtractionResult(
  validation: RecomendacionValidation,
): DataExtractionResult {
  return {
    ...validation,
    destinatarios: validation.destinatarios.map((destinatario) => ({
      ...destinatario,
      candidatos_nombre: [],
      candidatos_cargo: [],
    })),
  };
}

/**
 * Builds the editable values from the user's persisted validation, reusing
 * the stable destinatario ids from `suggestionIds` (positionally) so the
 * validation screen can later diff `values` against `suggestions` by id.
 */
function validationToValues(
  validation: RecomendacionValidation,
  suggestionIds: string[],
): RecomendacionValues {
  return {
    numero_recomendacion: validation.numero_recomendacion ?? "",
    fecha_recomendacion: validation.fecha_recomendacion ?? "",
    destinatarios: validation.destinatarios.map((destinatario, index) => ({
      id: suggestionIds[index] ?? crypto.randomUUID(),
      nombre: destinatario.nombre ?? "",
      cargo: destinatario.cargo ?? "",
      destinatario_principal: destinatario.destinatario_principal,
      sector: destinatario.sector ?? "",
    })),
    tema: validation.tema ?? "",
    subtema: validation.subtema ?? "",
    datos_personales: validation.datos_personales,
    contenido_para_publicar: validation.contenido_para_publicar,
  };
}

/**
 * Decides, for a single Recomendaciones file, whether to reuse whatever is
 * stored on the backend (§4.4) or run a fresh LLM extraction, and dispatches
 * the result to the file reducer as `file.recomendacion`.
 *
 * Idempotency guard: mirrors `useFileParse`'s pattern exactly — if
 * `file.recomendacion` is already set, this hook does nothing. Without this
 * guard the effect would re-fire and re-run an expensive LLM call.
 *
 * The GET (`loadRecomendacion`) is a `useQuery`; the extraction
 * (`extractRecomendacion`) is a `useMutation` triggered from an effect when
 * the GET resolves with nothing usable — not a chained query, so `retry()`
 * can be exposed.
 */
export function useDataExtraction(file: DocFile): DataExtractionResultShape {
  const dispatch = useFileDispatch();
  const queryClient = useQueryClient();

  const alreadySet = file.recomendacion !== undefined;
  const documentId = file.paragraphs?.[0]?.document_id;

  const queryKey = ["recomendacion", api.defaults.baseURL, documentId];

  const query = useQuery({
    queryKey,
    queryFn: ({ signal }) => loadRecomendacion(documentId as string, signal),
    enabled: !alreadySet && documentId !== undefined,
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
  });

  // Holds the AbortController for the currently in-flight extraction POST, so
  // it can be cancelled instead of orphaned when the user navigates away
  // mid-extraction (Stop button, or an unmount before the dispatch lands).
  const extractionControllerRef = useRef<AbortController | null>(null);

  const mutation = useMutation({
    mutationFn: () => {
      const controller = new AbortController();
      extractionControllerRef.current = controller;
      return extractRecomendacion(
        documentId as string,
        (file.paragraphs ?? []).map((paragraph) => paragraph.value),
        controller.signal,
      );
    },
  });

  // Synchronous latch, keyed by documentId, guarding the call to
  // `mutation.mutate()` below. `mutation.status` is a render snapshot, NOT a
  // synchronous lock: in React StrictMode the effect's setup function runs
  // twice against the SAME closure with no re-render in between, so checking
  // `mutation.status === "idle"` alone lets both invocations see "idle" and
  // fire two POSTs. This ref is mutated synchronously the first time, so the
  // second invocation (same tick, same closure) sees it and skips. Mirrors
  // `useTranscribe.ts`'s `userAbortedRef`/`controllerRef` pattern for the same
  // StrictMode hazard.
  const extractionStartedForRef = useRef<string | null>(null);

  // Cancel any in-flight extraction on unmount (or when the target document
  // changes) instead of leaving it orphaned. This also means a genuine
  // remount (e.g. navigate to preview and back) never races an old,
  // still-running request: the old one is aborted first.
  useEffect(() => {
    return () => {
      extractionControllerRef.current?.abort();
    };
  }, [documentId]);

  // Handles the GET's resolution: nothing usable stored (`null`, or a stored
  // document with neither `prediction` nor `validation`) triggers the
  // extraction mutation; a stored document with usable data is dispatched
  // straight away per the decision table.
  useEffect(() => {
    if (alreadySet || !query.isSuccess) return;

    const stored = query.data;

    const triggerExtraction = () => {
      if (extractionStartedForRef.current !== documentId) {
        extractionStartedForRef.current = documentId ?? null;
        mutation.mutate();
      }
    };

    // Nothing stored at all (404/absent).
    if (stored === null) {
      triggerExtraction();
      return;
    }

    const { prediction, validation } = stored;

    // Stored row exists but carries neither a prior inference nor a manual
    // validation (schema allows both to be `null`): same as absent, extract.
    if (prediction == null && validation == null) {
      triggerExtraction();
      return;
    }

    if (validation != null) {
      const base = normalizeExtraction(
        prediction ?? asExtractionResult(validation),
      );
      const suggestionIds = base.values.destinatarios.map(
        (destinatario) => destinatario.id,
      );
      dispatch(
        setRecomendacion(file.data.name, {
          documentId: documentId as string,
          origin: "validation",
          inference: prediction ?? asExtractionResult(validation),
          suggestions: base.values,
          values: validationToValues(validation, suggestionIds),
          candidates: prediction ? base.candidates : {},
        }),
      );
      return;
    }

    if (prediction != null) {
      const { values, candidates } = normalizeExtraction(prediction);
      dispatch(
        setRecomendacion(file.data.name, {
          documentId: documentId as string,
          origin: "stored-inference",
          inference: prediction,
          suggestions: values,
          values,
          candidates,
        }),
      );
    }
    // biome-ignore lint/correctness/useExhaustiveDependencies: file/mutation/dispatch are stable enough for this effect's purpose; re-running is guarded by `alreadySet`
  }, [alreadySet, query.isSuccess, query.data, documentId]);

  // Handles the mutation's resolution (the "call the LLM" branch).
  useEffect(() => {
    if (alreadySet || !mutation.isSuccess || mutation.data === undefined)
      return;

    const result = mutation.data;
    const { values, candidates } = normalizeExtraction(result);
    dispatch(
      setRecomendacion(file.data.name, {
        documentId: documentId as string,
        origin: "inference",
        inference: result,
        suggestions: values,
        values,
        candidates,
      }),
    );
    // biome-ignore lint/correctness/useExhaustiveDependencies: file/dispatch are stable enough for this effect's purpose; re-running is guarded by `alreadySet`
  }, [alreadySet, mutation.isSuccess, mutation.data, documentId]);

  const status: DataExtractionStatus = alreadySet
    ? "ready"
    : mutation.isError || query.isError
      ? "error"
      : documentId === undefined
        ? "idle"
        : "loading";

  const error = mutation.error ?? (query.error as Error | null) ?? null;

  const retry = () => {
    // The GET failed (e.g. it was aborted): re-run it, don't touch the
    // mutation. The effect above will react to its resolution as usual.
    if (query.isError) {
      query.refetch();
      return;
    }
    mutation.mutate();
  };

  const abort = () => {
    extractionControllerRef.current?.abort();
    queryClient.cancelQueries({ queryKey });
  };

  return { status, error, retry, abort };
}
