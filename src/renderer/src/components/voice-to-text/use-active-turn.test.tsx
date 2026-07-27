import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Turn } from "@/types/transcription";
import { useActiveTurn } from "./use-active-turn";

const turn = (id: string, startMs: number, endMs: number): Turn => ({
  id,
  speakerId: "s1",
  text: "",
  startMs,
  endMs,
});

const activeAt = (turns: Turn[], ms: number) =>
  renderHook(() => useActiveTurn(turns, ms)).result.current;

describe("useActiveTurn", () => {
  it("returns the turn whose [startMs, endMs) contains currentMs", () => {
    const turns = [turn("a", 0, 1000), turn("b", 1000, 2000)];
    expect(activeAt(turns, 1500)).toBe("b");
  });

  it("returns null when no turn covers currentMs", () => {
    expect(activeAt([turn("a", 0, 1000)], 5000)).toBeNull();
  });

  // Regression: splitting a turn and then moving the new turn's timestamp
  // earlier (UPDATE_TURN_START_MS shifts only that turn) leaves the previous
  // turn's endMs overlapping the new turn's startMs. Playback must recognise
  // the newly-started turn, not stay stuck on the earlier one.
  it("prefers the latest-starting turn when ranges overlap", () => {
    // b1 [1000, 2400) and b2 [2000, 8600) overlap on [2000, 2400).
    const turns = [turn("b1", 1000, 2400), turn("b2", 2000, 8600)];
    expect(activeAt(turns, 2000)).toBe("b2"); // b2's own timestamp
    expect(activeAt(turns, 2300)).toBe("b2"); // inside the overlap
    expect(activeAt(turns, 1500)).toBe("b1"); // before b2 starts
  });
});
