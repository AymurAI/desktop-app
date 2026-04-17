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

  const controller = useRef(new AbortController());

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally omitting onStatusChange to avoid re-runs on parent re-renders
  const updateStatus = useCallback((newValue: TranscribeStatus) => {
    setStatus(newValue);
    onStatusChange?.(newValue);
  }, []);

  const abort = () => {
    controller.current.abort();
    updateStatus("stopped");
    setProgress(0);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: dispatch/onTranscription/updateStatus are stable callbacks; files is the intended trigger
  useEffect(() => {
    if (files.length === 0) return;

    let active = true;

    const run = async () => {
      updateStatus("processing");
      setProgress(0);

      const promises = files.map(async (file) => {
        const result = await transcribe(file, controller.current.signal);

        if (!active) return;

        onTranscription?.(result);
        dispatch?.(addTranscription(result));
        setProgress((current) => current + 1 / files.length);
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
    };
  }, [files]);

  return { progress, status, abort };
}
