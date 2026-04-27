import { useCallback, useEffect, useRef, useState } from "react";

import { CanceledError } from "axios";

import type { TranscriptionAction } from "@/reducers/transcription";
import { addTranscription } from "@/reducers/transcription/actions";
import { transcribe } from "@/services/aymurai/transcribe";
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
  const [status, setStatus] = useState<TranscribeStatus>("idle");
  const [partialText, setPartialText] = useState("");

  // Tracks the AbortController of the in-flight run so the consumer's abort()
  // can cancel whatever is currently running. A new controller is created per
  // run inside the effect — never reuse one across runs (an aborted controller
  // stays aborted forever).
  const activeControllerRef = useRef<AbortController | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally omitting onStatusChange to avoid re-runs on parent re-renders
  const updateStatus = useCallback((newValue: TranscribeStatus) => {
    setStatus(newValue);
    onStatusChange?.(newValue);
  }, []);

  const abort = () => {
    activeControllerRef.current?.abort();
    updateStatus("stopped");
    setProgress(0);
    setPartialText("");
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: dispatch/onTranscription/updateStatus are stable callbacks; files is the intended trigger
  useEffect(() => {
    if (files.length === 0) return;

    let active = true;
    const controller = new AbortController();
    activeControllerRef.current = controller;
    const perFileRatios = new Array(files.length).fill(0);

    const recomputeProgress = () => {
      if (!active) return;
      const total = perFileRatios.reduce((sum, r) => sum + r, 0);
      setProgress(total / files.length);
    };

    const run = async () => {
      updateStatus("processing");
      setProgress(0);
      setPartialText("");

      const promises = files.map(async (file, idx) => {
        const result = await transcribe(file, {
          signal: controller.signal,
          onProgress: (ratio) => {
            if (!active) return;
            perFileRatios[idx] = ratio;
            recomputeProgress();
          },
          onPartialText: (text) => {
            if (!active) return;
            setPartialText(text);
          },
        });

        if (!active) return;

        perFileRatios[idx] = 1;
        recomputeProgress();

        onTranscription?.(result);
        dispatch?.(addTranscription(result));
      });

      await Promise.all(promises)
        .then(() => {
          if (!active) return;
          updateStatus("completed");
        })
        .catch((err) => {
          if (!active) return;
          if (err instanceof CanceledError) {
            updateStatus("stopped");
          } else {
            setProgress(0);
            updateStatus("error");
          }
        });
    };

    run();

    return () => {
      active = false;
      // Cancel the in-flight SSE so a re-run (e.g. React StrictMode's
      // mount → unmount → mount in dev) doesn't leave a stale stream open.
      // The catch handler bails early because `active` is already false.
      controller.abort();
      if (activeControllerRef.current === controller) {
        activeControllerRef.current = null;
      }
    };
  }, [files]);

  return { progress, status, abort, partialText };
}
