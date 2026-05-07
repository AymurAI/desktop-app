import type { PredictLabel } from "@/types/aymurai";
import { useCallback, useRef } from "react";
import {
  type CheckpointData,
  createCheckpointService,
} from "@/services/checkpoint";

const service = createCheckpointService();

function predictionKey(p: PredictLabel): string {
  return `${p.text}|${p.start_char}|${p.end_char}|${p.paragraphId}`;
}

export function useCheckpoint() {
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const saveCheckpoint = useCallback(
    (documentId: string, data: CheckpointData) => {
      const existing = timers.current.get(documentId);
      if (existing) clearTimeout(existing);
      timers.current.set(
        documentId,
        setTimeout(() => {
          service.save(documentId, { ...data, savedAt: Date.now() });
          timers.current.delete(documentId);
        }, 500),
      );
    },
    [],
  );

  const loadCheckpoint = useCallback(
    (documentId: string): CheckpointData | null => {
      return service.load(documentId);
    },
    [],
  );

  const clearCheckpoint = useCallback((documentId: string) => {
    const existing = timers.current.get(documentId);
    if (existing) clearTimeout(existing);
    timers.current.delete(documentId);
    service.clear(documentId);
  }, []);

  const loadAllCheckpoints = useCallback(() => {
    return service.loadAll();
  }, []);

  const mergeCheckpoint = useCallback(
    (documentId: string, newPredictions: PredictLabel[]): PredictLabel[] => {
      const saved = service.load(documentId);
      if (!saved) return newPredictions;
      const savedByKey = new Map<string, PredictLabel>();
      for (const p of saved.predictions) {
        savedByKey.set(predictionKey(p), p);
      }
      return newPredictions.map((p) => {
        const key = predictionKey(p);
        return savedByKey.get(key) ?? p;
      });
    },
    [],
  );

  return { saveCheckpoint, loadCheckpoint, clearCheckpoint, loadAllCheckpoints, mergeCheckpoint };
}
