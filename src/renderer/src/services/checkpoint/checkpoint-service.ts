import type { CheckpointData, CheckpointService } from "./types";

const KEY_PREFIX = "checkpoint:";

export function createCheckpointService(): CheckpointService {
  return {
    save(documentId: string, data: CheckpointData) {
      localStorage.setItem(`${KEY_PREFIX}${documentId}`, JSON.stringify(data));
    },
    load(documentId: string): CheckpointData | null {
      const raw = localStorage.getItem(`${KEY_PREFIX}${documentId}`);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as CheckpointData;
      } catch {
        return null;
      }
    },
    clear(documentId: string) {
      localStorage.removeItem(`${KEY_PREFIX}${documentId}`);
    },
    loadAll(): Record<string, CheckpointData> {
      const result: Record<string, CheckpointData> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key?.startsWith(KEY_PREFIX)) continue;
        const docId = key.slice(KEY_PREFIX.length);
        const data = this.load(docId);
        if (data) result[docId] = data;
      }
      return result;
    },
  };
}
