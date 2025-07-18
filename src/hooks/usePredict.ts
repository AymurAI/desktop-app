import { useCallback, useEffect, useRef, useState } from "react";

import { useFileDispatch, useFileParser, useUser } from "hooks";
import { addPredictions, removePredictions } from "reducers/file/actions";
import { predict } from "services/aymurai";

import type { DocFile } from "types/file";
import { FunctionType } from "types/user";

export type PredictStatus = "processing" | "error" | "stopped" | "completed";

interface UsePredictOptions {
  onStatusChange?: (status: PredictStatus) => void;
}
export function usePredict(
  file: DocFile,
  { onStatusChange }: UsePredictOptions,
  serverUrl: string,
) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<PredictStatus>("processing");
  const dispatch = useFileDispatch();
  const paragraphs = useFileParser(file, serverUrl);

  const user = useUser();
  const isAnonimizing = user?.function === FunctionType.ANONYMIZER;

  // Store static values
  const controller = useRef(new AbortController());

  // Handlers
  const updateStatus = useCallback((newValue: PredictStatus) => {
    setStatus(newValue);
    onStatusChange?.(newValue);
    // This next line is disabled because the function should only be created once
  }, []);

  const abort = () => {
    controller.current.abort();

    dispatch(removePredictions(file.data.name));
    updateStatus("stopped");
    setProgress(0);
  };

  // Stream predictions
  useEffect(() => {
    let loading = true;

    const fetch = async () => {
      if (!loading || !paragraphs || status !== "processing") return;

      const promises = paragraphs.map(async (p) => {
        const prediction = await predict(
          p,
          controller.current,
          isAnonimizing ? "anonymizer" : "datapublic",
          serverUrl,
        );

        dispatch(addPredictions(file.data.name, prediction));
        // Increase progress %
        setProgress((current) => current + 1 / paragraphs!.length);
      });

      // Once all promises are resolved, set status to completed or error if applicable
      await Promise.all(promises)
        .then(() => {
          updateStatus("completed");
        })
        .catch(() => {
          setProgress(0);
          updateStatus("error");
        });
    };

    fetch();

    return () => {
      loading = false;
    };
  }, [controller, status]);

  return { progress, abort, status };
}
