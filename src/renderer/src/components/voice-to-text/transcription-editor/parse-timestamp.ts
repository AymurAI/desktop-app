/**
 * Parse "mm:ss" or "hh:mm:ss" → milliseconds, or null if invalid.
 *
 * Rules (copied verbatim from turn-floating-toolbar.tsx local helper so it can
 * be shared once that file is removed):
 *  - Accepts 1–3 digit minute/hour component, 1–2 digit second component.
 *  - Rejects m > 59 or s > 59.
 *  - Returns null for any non-matching or out-of-range input.
 */
export function parseTimestampToMs(input: string): number | null {
  const trimmed = input.trim();
  if (!/^\d{1,3}(?::\d{1,2}){1,2}$/.test(trimmed)) return null;
  const parts = trimmed.split(":").map((p) => Number.parseInt(p, 10));
  if (parts.some((n) => Number.isNaN(n))) return null;
  let h = 0;
  let m = 0;
  let s = 0;
  if (parts.length === 2) [m, s] = parts;
  else [h, m, s] = parts;
  if (m > 59 || s > 59) return null;
  return ((h * 60 + m) * 60 + s) * 1000;
}
