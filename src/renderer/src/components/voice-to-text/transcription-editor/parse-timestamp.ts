import { isValidTimestamp } from "@aymurai/ui";

/** Parse a syntactically valid `MM:SS` or `H+:MM:SS` timestamp. */
export function parseTimestampToMs(input: string): number | null {
  const trimmed = input.trim();
  if (!isValidTimestamp(trimmed)) return null;

  const parts = trimmed.split(":").map((p) => Number.parseInt(p, 10));
  let h = 0;
  let m = 0;
  let s = 0;
  if (parts.length === 2) {
    [m, s] = parts;
  } else {
    [h, m, s] = parts;
  }
  return (h * 3600 + m * 60 + s) * 1000;
}
