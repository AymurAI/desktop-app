import { css } from "@/styled/css";
import { styled } from "@/styled/jsx";
import type { Paragraph } from "@/types/file";
import { Toolbar } from "@aymurai/ui";
import { useEffect, useMemo, useRef, useState } from "react";

const highlight = css({ bg: "category.yellow-light" });
const activeHighlight = css({ bg: "category.orange-light" });

// Mirrors file-annotator/FileAnnotator.styles.ts `container` exactly — the
// Set de Datos reference for this pane. No padding here: the Toolbar and
// the scrollable text area each own their own spacing, so the scrollable
// div's native scrollbar ends up flush against the grid divider instead of
// inset by an outer wrapper's padding.
const container = css({
  height: "full",
  minHeight: "[0]",
  minWidth: "[0]",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
});

// Native (unstyled) scrollbar, matching the Set de Datos / FileAnnotator
// reference — that pane doesn't override the OS/Chromium scrollbar either.
// px/pb (not pt — FileAnnotator's `file` class has none either; the Toolbar
// above already supplies its own bottom padding) match FileAnnotator's
// `file` class so the text column and scroll edge land in the same place.
const paragraphList = css({
  flex: "[1]",
  minHeight: "[0]",
  overflowY: "auto",
  overflowX: "hidden",
  px: "8",
  pb: "8",
});

// Matches FileAnnotator's original-document text exactly (the "Set de
// Datos" reference for this pane): serif "file" font token, 16px/160%, with
// 8px vertical spacing between paragraphs — see
// file-annotator/FileAnnotator.styles.ts. Deliberately not the app's default
// `paragraph.md.default` textStyle, which is sans-serif/18px/150% and has no
// paragraph margin of its own.
const paragraphText = css({
  fontFamily: "file",
  fontSize: "[16px]",
  lineHeight: "[160%]",
  my: "2",
});

interface Match {
  paragraphIndex: number;
  occurrenceIndex: number; // 0-based index of this match among all matches within its own paragraph
}

function findMatches(paragraphs: Paragraph[], query: string): Match[] {
  if (!query) return [];
  const lowerQuery = query.toLowerCase();
  const matches: Match[] = [];

  paragraphs.forEach((paragraph, paragraphIndex) => {
    const lowerValue = paragraph.value.toLowerCase();
    let fromIndex = 0;
    let occurrenceIndex = 0;
    for (;;) {
      const index = lowerValue.indexOf(lowerQuery, fromIndex);
      if (index === -1) break;
      matches.push({ paragraphIndex, occurrenceIndex });
      fromIndex = index + lowerQuery.length;
      occurrenceIndex++;
    }
  });

  return matches;
}

function HighlightedParagraph({
  text,
  query,
  activeMatchIndex,
  activeMarkRef,
}: {
  text: string;
  query: string;
  activeMatchIndex: number | null;
  activeMarkRef?: (el: HTMLElement | null) => void;
}) {
  if (!query) return <styled.p className={paragraphText}>{text}</styled.p>;

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
    const isActive = occurrence === activeMatchIndex;
    parts.push(
      <mark
        key={occurrence}
        ref={isActive ? activeMarkRef : undefined}
        className={isActive ? activeHighlight : highlight}
      >
        {text.slice(index, index + query.length)}
      </mark>,
    );
    cursor = index + query.length;
    occurrence++;
  }

  return <styled.p className={paragraphText}>{parts}</styled.p>;
}

export interface DocumentSearchPanelProps {
  paragraphs: Paragraph[];
}

export default function DocumentSearchPanel({
  paragraphs,
}: DocumentSearchPanelProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const activeMarkRef = useRef<HTMLElement | null>(null);

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

  useEffect(() => {
    if (!activeMatch) return;
    activeMarkRef.current?.scrollIntoView({ block: "center" });
  }, [activeMatch]);

  return (
    <div className={container}>
      <Toolbar
        context="anonimizador"
        searchValue={query}
        onSearchChange={handleQueryChange}
        searchPlaceholder="Buscar"
        searchAriaLabel="Buscar en el documento original"
        searchResultCount={
          query
            ? matches.length === 0
              ? "0 de 0"
              : `${activeIndex + 1} de ${matches.length}`
            : undefined
        }
        onSearchPrev={query ? () => goToMatch(-1) : undefined}
        onSearchNext={query ? () => goToMatch(1) : undefined}
        onSearchClear={query ? () => handleQueryChange("") : undefined}
      />

      <div className={paragraphList}>
        {paragraphs.map((paragraph, index) => {
          const isActiveParagraph = activeMatch?.paragraphIndex === index;
          return (
            <HighlightedParagraph
              key={paragraph.id}
              text={paragraph.value}
              query={query}
              activeMatchIndex={
                isActiveParagraph ? activeMatch.occurrenceIndex : null
              }
              activeMarkRef={
                isActiveParagraph
                  ? (el) => {
                      activeMarkRef.current = el;
                    }
                  : undefined
              }
            />
          );
        })}
      </div>
    </div>
  );
}
