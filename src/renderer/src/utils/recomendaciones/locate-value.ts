import type { Paragraph } from "@/types/file";
import { distance } from "fastest-levenshtein";

export interface LocatedRange {
  paragraphId: string;
  start: number;
  end: number;
  score: number;
  exact: boolean;
}

export interface LocateOptions {
  threshold?: number;
  minLength?: number;
  maxMatches?: number;
}

export function normalizeForMatch(text: string): {
  normalized: string;
  map: number[];
} {
  let normalized = "";
  const map: number[] = [];
  let inWhitespace = false;

  for (let i = 0; i < text.length; i++) {
    const raw = text[i];
    if (/\s/.test(raw)) {
      if (inWhitespace) continue;
      inWhitespace = true;
      normalized += " ";
      map.push(i);
      continue;
    }
    inWhitespace = false;
    // NFD + strip combining marks; a single character can normalize to ""
    // (e.g. a lone accent mark) or to more than one character.
    const folded = raw
      .normalize("NFD")
      .replace(/\p{Mn}/gu, "")
      .toLowerCase();
    for (const ch of folded) {
      normalized += ch;
      map.push(i);
    }
  }
  map.push(text.length); // sentinel so `end` at the very end of the string resolves
  return { normalized, map };
}

const similarity = (a: string, b: string) =>
  1 - distance(a, b) / Math.max(a.length, b.length);

export function locateValue(
  value: string,
  paragraphs: Paragraph[],
  { threshold = 0.9, minLength = 4, maxMatches = 3 }: LocateOptions = {},
): LocatedRange[] {
  const { normalized: needle } = normalizeForMatch(value);
  const trimmed = needle.trim();
  if (trimmed.length < minLength) return [];

  const len = trimmed.length;

  // Pass 1 — exact, over ALL paragraphs.
  const exact: LocatedRange[] = [];
  for (const paragraph of paragraphs) {
    const { normalized, map } = normalizeForMatch(paragraph.value);
    let from = 0;
    for (;;) {
      const at = normalized.indexOf(trimmed, from);
      if (at === -1) break;
      exact.push({
        paragraphId: paragraph.id,
        start: map[at],
        end: map[at + len],
        score: 1,
        exact: true,
      });
      from = at + 1;
    }
  }
  if (exact.length > 0) return exact.slice(0, maxMatches);

  // Pass 2 — fuzzy, only if NO exact match was found anywhere in the document.
  let best: LocatedRange | null = null;
  const step = Math.max(1, Math.floor(len / 8));
  for (const paragraph of paragraphs) {
    const { normalized, map } = normalizeForMatch(paragraph.value);
    if (normalized.length < len * threshold) continue;
    const maxStart = normalized.length - Math.ceil(len * threshold);
    if (maxStart < 0) continue;
    for (let i = 0; i <= maxStart; i += step) {
      const end = Math.min(i + len, normalized.length);
      const score = similarity(trimmed, normalized.slice(i, end));
      // `>` not `>=`: on a tie the first candidate wins, in (paragraph
      // order, start offset) order — determinism required by the spec.
      if (score >= threshold && (!best || score > best.score)) {
        best = {
          paragraphId: paragraph.id,
          start: map[i],
          end: map[end],
          score,
          exact: false,
        };
      }
    }
  }
  return best ? [best] : [];
}
