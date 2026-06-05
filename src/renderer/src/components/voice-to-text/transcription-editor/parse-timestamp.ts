/**
 * Parse "mm:ss" or "hh:mm:ss" → milliseconds, or null if invalid.
 *
 * 2-part form `mm:ss`:
 *   - minutes may be ANY non-negative integer (total-minutes, mirrors formatTime
 *     which never wraps minutes past 59 — e.g. 1h05m → "65:00").
 *   - seconds must be 0–59.
 *   - ms = (minutes * 60 + seconds) * 1000.
 *
 * 3-part form `hh:mm:ss`:
 *   - hours may be any non-negative integer.
 *   - minutes must be 0–59.
 *   - seconds must be 0–59.
 *   - ms = (hours * 3600 + minutes * 60 + seconds) * 1000.
 *
 * Returns null for any non-matching or out-of-range input.
 */
export function parseTimestampToMs(input: string): number | null {
  const trimmed = input.trim();
  if (!/^\d+:\d{1,2}$/.test(trimmed) && !/^\d+:\d{1,2}:\d{1,2}$/.test(trimmed))
    return null;
  const parts = trimmed.split(":").map((p) => Number.parseInt(p, 10));
  if (parts.some((n) => Number.isNaN(n))) return null;
  let h = 0;
  let m = 0;
  let s = 0;
  if (parts.length === 2) {
    [m, s] = parts;
    if (s > 59) return null;
  } else {
    [h, m, s] = parts;
    if (m > 59 || s > 59) return null;
  }
  return (h * 3600 + m * 60 + s) * 1000;
}
