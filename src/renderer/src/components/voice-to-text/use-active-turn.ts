import { useMemo } from "react";

import type { Turn } from "@/types/transcription";

/**
 * Returns the id of the turn currently playing
 * (whose [startMs, endMs] contains currentMs), or null if none.
 */
export function useActiveTurn(turns: Turn[], currentMs: number): string | null {
  return useMemo(() => {
    for (const turn of turns) {
      if (currentMs >= turn.startMs && currentMs < turn.endMs) {
        return turn.id;
      }
    }
    return null;
  }, [turns, currentMs]);
}
