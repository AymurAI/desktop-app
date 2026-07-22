import { useMemo } from "react";

import type { Turn } from "@/types/transcription";

/**
 * Returns the id of the turn currently playing
 * (whose [startMs, endMs) contains currentMs), or null if none.
 *
 * When more than one turn's range contains currentMs — which happens after a
 * manual timestamp edit shifts a turn's start before the previous turn's end,
 * leaving them overlapping — the latest-starting one wins, so a freshly split
 * turn is recognised at its own timestamp instead of being masked by the turn
 * before it.
 */
export function useActiveTurn(turns: Turn[], currentMs: number): string | null {
  return useMemo(() => {
    let active: Turn | null = null;
    for (const turn of turns) {
      if (currentMs >= turn.startMs && currentMs < turn.endMs) {
        if (!active || turn.startMs > active.startMs) active = turn;
      }
    }
    return active?.id ?? null;
  }, [turns, currentMs]);
}
