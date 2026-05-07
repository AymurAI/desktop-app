import type { FormData } from "@/hooks/useForm";
import type { PredictLabel } from "@/types/aymurai";

export interface CheckpointData {
  predictions: PredictLabel[];
  validationObject: FormData;
  validated: boolean;
  savedAt: number;
}

export interface CheckpointService {
  save(documentId: string, data: CheckpointData): void;
  load(documentId: string): CheckpointData | null;
  clear(documentId: string): void;
  loadAll(): Record<string, CheckpointData>;
}
