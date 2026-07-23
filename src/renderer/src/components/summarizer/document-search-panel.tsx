import { css } from "@/styled/css";
import { HStack, Stack, styled } from "@/styled/jsx";
import type { Paragraph } from "@/types/file";
import { Button } from "@aymurai/ui";
import { useMemo, useRef, useState } from "react";

const searchInput = css({
  border: "primary",
  rounded: "full",
  px: "4",
  py: "3",
  width: "full",
  outline: "none",
  "&:focus-visible": { border: "primary-alt" },
});

const highlight = css({ bg: "category.yellow-light" });
const activeHighlight = css({ bg: "category.orange-light" });

interface Match {
  paragraphIndex: number;
  matchIndex: number;
}

function findMatches(paragraphs: Paragraph[], query: string): Match[] {
  if (!query) return [];
  const lowerQuery = query.toLowerCase();
  const matches: Match[] = [];

  paragraphs.forEach((paragraph, paragraphIndex) => {
    const lowerValue = paragraph.value.toLowerCase();
    let fromIndex = 0;
    for (;;) {
      const index = lowerValue.indexOf(lowerQuery, fromIndex);
      if (index === -1) break;
      matches.push({ paragraphIndex, matchIndex: index });
      fromIndex = index + lowerQuery.length;
    }
  });

  return matches;
}

function HighlightedParagraph({
  text,
  query,
  activeMatchIndex,
}: {
  text: string;
  query: string;
  activeMatchIndex: number | null;
}) {
  if (!query)
    return <styled.p textStyle="paragraph.md.default">{text}</styled.p>;

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  let occurrence = 0;

  for (;;) {
    const index = lowerText.indexOf(lowerQuery, cursor);
    if (index === -1) {
      parts.push(text.slice(cursor));
      break;
    }
    parts.push(text.slice(cursor, index));
    parts.push(
      <mark
        key={occurrence}
        className={
          occurrence === activeMatchIndex ? activeHighlight : highlight
        }
      >
        {text.slice(index, index + query.length)}
      </mark>,
    );
    cursor = index + query.length;
    occurrence++;
  }

  return <styled.p textStyle="paragraph.md.default">{parts}</styled.p>;
}

export interface DocumentSearchPanelProps {
  paragraphs: Paragraph[];
}

export default function DocumentSearchPanel({
  paragraphs,
}: DocumentSearchPanelProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(
    () => findMatches(paragraphs, query),
    [paragraphs, query],
  );

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setActiveIndex(0);
  };

  const goToMatch = (delta: number) => {
    if (matches.length === 0) return;
    setActiveIndex((prev) => (prev + delta + matches.length) % matches.length);
  };

  const activeMatch = matches[activeIndex];

  return (
    <Stack gap="4" p="6" overflowY="auto" height="full">
      <HStack gap="3">
        <input
          role="searchbox"
          aria-label="Buscar en el documento original"
          className={searchInput}
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
        />
        {query && (
          <HStack gap="2">
            <styled.span textStyle="label.sm.default">
              {matches.length === 0
                ? "0 de 0"
                : `${activeIndex + 1} de ${matches.length}`}
            </styled.span>
            <Button
              variant="none"
              size="icon-sm"
              aria-label="Anterior"
              onClick={() => goToMatch(-1)}
            >
              ‹
            </Button>
            <Button
              variant="none"
              size="icon-sm"
              aria-label="Siguiente"
              onClick={() => goToMatch(1)}
            >
              ›
            </Button>
          </HStack>
        )}
      </HStack>

      <div ref={containerRef}>
        {paragraphs.map((paragraph, index) => (
          <HighlightedParagraph
            key={paragraph.id}
            text={paragraph.value}
            query={query}
            activeMatchIndex={
              activeMatch?.paragraphIndex === index
                ? activeMatch.matchIndex
                : null
            }
          />
        ))}
      </div>
    </Stack>
  );
}
