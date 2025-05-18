import { useEffect, useState, useRef, useCallback } from "react";

import { useFileDispatch, useFileParser, useUser } from "hooks";
import { predict, validateAnonymizer } from "services/aymurai";
import { addPredictions, removePredictions } from "reducers/file/actions";

import { FunctionType } from "types/user";
import { DocFile } from "types/file";
import { getDocumentValidation } from "services/aymurai/validate/validate-datapublic";

export type PredictStatus = "processing" | "error" | "stopped" | "completed";

interface UsePredictOptions {
  onStatusChange?: (status: PredictStatus) => void;
}
export function usePredict(
  file: DocFile,
  { onStatusChange }: UsePredictOptions,
  serverUrl: string
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        let prediction;
        if (isAnonimizing) {
          prediction = await validateAnonymizer(
            p,
            controller.current,
            serverUrl
          );
          if (!prediction) {
            prediction = await predict({
              paragraph: p,
              controller: controller.current,
              route: "anonymizer",
              documentId: file.documentId || "",
              serverUrl,
            });
          }

          dispatch(addPredictions(file.data.name, prediction));
          // Increase progress %
          setProgress((current) => current + 1 / paragraphs!.length);
        } else {
          const validated = await getDocumentValidation(
            file.documentId || "",
            controller.current,
            serverUrl
          );
          if (validated) {
            prediction = validated;
          } else {
            prediction = await predict({
              paragraph: p,
              controller: controller.current,
              route: "datapublic",
              documentId: file.documentId || "",
              serverUrl,
            });
            dispatch(addPredictions(file.data.name, prediction));
            // Increase progress %
            setProgress((current) => current + 1 / paragraphs!.length);
          }
        }
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
