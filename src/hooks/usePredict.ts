import { useFileParser, useFiles } from 'hooks';
import { useEffect, useState } from 'react';
import predict from 'services/predict';
import { PredictLabel } from 'types/predict';
import { toPlainParagraphs } from 'utils/html';

export type FileStatus = 'processing' | 'error' | 'stopped' | 'completed';

export default function usePredict(file: File) {
  const [status, setStatus] = useState<FileStatus>('processing');
  const [progress, setProgress] = useState(0);
  const [promises, setPromises] = useState<Promise<PredictLabel[]>[]>([]);

  const html = useFileParser(file);
  const { addPrediction } = useFiles();

  const [controller] = useState(new AbortController());

  const abort = () => {
    controller.abort();
    setStatus('stopped');
    setProgress(0);
  };

  useEffect(() => {
    if (html) {
      const paragraphs = toPlainParagraphs(html);

      const promises = paragraphs.map(async (p) => {
        const prediction = await predict(p, controller);

        setProgress((current) => current + 1 / paragraphs.length);
        return prediction;
      });

      setPromises(promises);
    }
  }, [html, controller]);

  useEffect(() => {
    if (promises.length > 0 && status === 'processing') {
      Promise.all(promises)
        .then((results) => {
          results.forEach((prediction) => addPrediction(file.name, prediction));
        })
        .then(() => setStatus('completed'))
        .catch(() => setStatus('error'));
    }
  }, [addPrediction, file.name, promises, status]);

  return { status, progress, abort };
}
