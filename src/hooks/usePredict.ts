import { useEffect, useState, useRef } from 'react';

import { useFileDispatch, useFileParser } from 'hooks';
import { predict } from 'services/predict';
import { PredictLabel } from 'types/predict';
import { toPlainParagraphs } from 'utils/html';
import {
  addPredictions,
  removeAllPredictions,
  removePredictions,
} from 'reducers/file/actions';

export type PredictStatus = 'processing' | 'error' | 'stopped' | 'completed';

/**
 * Makes a prediction based on the given file
 * @param file File used with the AI to get predictions
 * @returns The `status` and `progress` of the prediction, along with an `abort()` function to cancel the process whenever is needed
 */
export default function usePredict(file: File) {
  const [status, setStatus] = useState<PredictStatus>('processing');
  const [progress, setProgress] = useState(0);
  const [promises, setPromises] = useState<Promise<PredictLabel[]>[]>([]);

  const html = useFileParser(file);
  const dispatch = useFileDispatch();

  // Store static values
  const controller = useRef(new AbortController());
  // This 'cancelled' value is used to cancel any ongoing promise before making further changes to the state
  const cancelled = useRef(false);

  const abort = () => {
    cancelled.current = true;
    controller.current.abort();
    setPromises(() => {
      dispatch(removePredictions(file.name));
      setProgress(0);
      setStatus('stopped');
      return [];
    });
  };

  // Generate Promises
  useEffect(() => {
    // If the HTML is valid and we have no promises yet
    if (html && promises.length === 0) {
      // Restart the prediction process
      dispatch(removeAllPredictions());
      const paragraphs = toPlainParagraphs(html);

      const promises = paragraphs.map(async (p) => {
        const prediction = await predict(p, controller.current);

        // Increase progress %
        setProgress((current) => current + 1 / paragraphs.length);

        return prediction;
      });

      setPromises(promises);
    }
  }, [html, dispatch, promises.length]);

  // Completed promises
  useEffect(() => {
    if (promises.length > 0) {
      Promise.all(promises)
        .then((result) => {
          // Check if the prediction process is still ongoing
          if (!cancelled.current) {
            result.forEach((prediction) => {
              dispatch(addPredictions(file.name, prediction));
            });

            setStatus('completed');
          }
        })
        .catch(() => setStatus('error'));
    }
  }, [promises, file.name, dispatch]);

  return { status, progress, abort };
}