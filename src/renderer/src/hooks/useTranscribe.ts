import { useMutation } from "@tanstack/react-query";
import { CanceledError } from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { TranscriptionAction } from "@/reducers/transcription";
import { addTranscription } from "@/reducers/transcription/actions";
import { transcribeBatch } from "@/services/aymurai/queries";
import type { Transcription } from "@/types/transcription";

export type TranscribeStatus =
  | "idle"
  | "processing"
  | "completed"
  | "error"
  | "stopped";

interface UseTranscribeOptions {
  onTranscription?: (transcription: Transcription) => void;
  onStatusChange?: (status: TranscribeStatus) => void;
  dispatch?: React.Dispatch<TranscriptionAction>;
}

export function useTranscribe(
  files: File[],
  { onTranscription, onStatusChange, dispatch }: UseTranscribeOptions = {},
) {
  const [progress, setProgress] = useState(0);
  const [partialText, setPartialText] = useState("");
  const [stopped, setStopped] = useState(false);

  // Distinguishes a user-initiated abort (→ "stopped") from a cleanup-driven
  // abort during StrictMode double-mount (→ silently ignored).
  const userAbortedRef = useRef(false);
  const controllerRef = useRef<AbortController | null>(null);

  const onStatusChangeRef = useRef(onStatusChange);
  const onTranscriptionRef = useRef(onTranscription);
  const dispatchRef = useRef(dispatch);
  onStatusChangeRef.current = onStatusChange;
  onTranscriptionRef.current = onTranscription;
  dispatchRef.current = dispatch;

  const mutation = useMutation(
    transcribeBatch({
      onProgress: (ratio) => setProgress(ratio),
      onPartialText: (text) => setPartialText(text),
    }),
  );

  const { mutate, reset } = mutation;

  // Stable key so identical file lists don't refire the run on parent re-renders.
  const filesKey = useMemo(
    () => files.map((f) => `${f.name}:${f.size}`).join("|"),
    [files],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: filesKey is the intended trigger; mutate/reset are stable
  useEffect(() => {
    if (files.length === 0) return;

    userAbortedRef.current = false;
    setStopped(false);
    setProgress(0);
    setPartialText("");

    let active = true;
    const controller = new AbortController();
    controllerRef.current = controller;

    // Defer the actual fire by one microtask. In React StrictMode dev, the
    // mount → cleanup → remount pair runs synchronously: the cleanup below
    // flips `active = false` before the microtask resolves, so the first
    // mount's mutate is skipped and only the surviving mount issues the SSE
    // request. In production (no double-mount), this is a no-op delay.
    Promise.resolve().then(() => {
      if (!active) return;
      mutate(
        { files, signal: controller.signal },
        {
          onSuccess: (results) => {
            for (const result of results) {
              onTranscriptionRef.current?.(result);
              dispatchRef.current?.(addTranscription(result));
            }
          },
        },
      );
    });

    return () => {
      active = false;
      controller.abort();
      if (controllerRef.current === controller) {
        controllerRef.current = null;
      }
    };
  }, [filesKey]);

  const status: TranscribeStatus = useMemo(() => {
    if (stopped) return "stopped";
    if (mutation.isPending) return "processing";
    if (mutation.isSuccess) return "completed";
    if (mutation.isError) {
      return mutation.error instanceof CanceledError ? "stopped" : "error";
    }
    return "idle";
  }, [
    stopped,
    mutation.isPending,
    mutation.isSuccess,
    mutation.isError,
    mutation.error,
  ]);

  // Notify status changes via callback while keeping it out of effect deps.
  const lastStatusRef = useRef<TranscribeStatus>("idle");
  useEffect(() => {
    if (lastStatusRef.current !== status) {
      lastStatusRef.current = status;
      onStatusChangeRef.current?.(status);
    }
  }, [status]);

  const abort = useCallback(() => {
    userAbortedRef.current = true;
    setStopped(true);
    setProgress(0);
    setPartialText("");
    controllerRef.current?.abort();
    reset();
  }, [reset]);

  return { progress, status, partialText, abort };
}
