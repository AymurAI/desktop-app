/**
 * Splits a `[startMs, endMs)` time range proportionally by character offset.
 * Used when a turn's text is divided (e.g. splitting a turn into a new
 * speaker) and each resulting piece needs its own, non-overlapping time
 * range instead of all pieces claiming the original full range.
 *
 * There's no word-level timing in the transcript data model, so this is a
 * best-effort linear interpolation (chars-per-ms), not derived from real
 * audio alignment.
 *
 * @param offsets Character offsets into the original text, each in [0, totalLen]
 * @returns One timestamp (ms) per offset, in the same order
 */
export function apportionTimeRange(
  startMs: number,
  endMs: number,
  totalLen: number,
  offsets: number[],
): number[] {
  const duration = Math.max(0, endMs - startMs);
  if (totalLen <= 0) return offsets.map(() => startMs);

  return offsets.map((offset) => {
    const clamped = Math.min(Math.max(offset, 0), totalLen);
    return startMs + Math.round((duration * clamped) / totalLen);
  });
}
