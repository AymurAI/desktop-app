import { memo, useEffect, useRef, useState } from "react";

import { css } from "@/styled/css";

const base = css({
  fontSize: "[16px]",
  lineHeight: "[26px]",
  fontWeight: "[300]",
  color: "text.default",
  m: "[0]",
});

const editable = css({
  outline: "none",
  rounded: "[8px]",
  px: "2",
  py: "1",
  mx: "[-8px]",
  cursor: "text",
  transition: "[background 140ms, box-shadow 140ms]",
  "&:hover": { bg: "bg.primary" },
  "&:focus": {
    bg: "bg.secondary",
    boxShadow: "[0 0 0 1.5px token(colors.action.default)]",
  },
});

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Wraps case-insensitive matches of `query` in `<mark>`, HTML-escaping
 * everything else. Splits on a capturing-group regex (rather than escaping
 * first, then matching) so matching stays correct even if `query` or `text`
 * contain HTML-sensitive characters.
 */
function highlightHtml(text: string, query?: string): string {
  if (!query) return escapeHtml(text);
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escapedQuery})`, "gi");
  return text
    .split(regex)
    .map((part, i) =>
      i % 2 === 1 ? `<mark>${escapeHtml(part)}</mark>` : escapeHtml(part),
    )
    .join("");
}

interface EditableTurnTextProps {
  turnId: string;
  text: string;
  /** Current search query — matches are wrapped in `<mark>` while unfocused. */
  highlight?: string;
  ariaLabel: string;
  onCommit: (turnId: string, value: string) => void;
  onSelect: () => void;
  onFocusChange?: (turnId: string, isFocused: boolean) => void;
}

export const EditableTurnText = memo(
  function EditableTurnText({
    turnId,
    text,
    highlight,
    ariaLabel,
    onCommit,
    onSelect,
    onFocusChange,
  }: EditableTurnTextProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    // Search highlighting is painted as static <mark> markup via a direct
    // innerHTML write, never through React children — this div is
    // intentionally uncontrolled (see the contentEditable below) to preserve
    // caret position while typing. Skipped while focused so an in-progress
    // edit is never rewritten out from under the caret; onCommit already
    // reads textContent below, which ignores markup either way.
    useEffect(() => {
      const el = ref.current;
      if (!el || isFocused) return;
      el.innerHTML = highlightHtml(text, highlight);
    }, [text, highlight, isFocused]);

    return (
      <div
        ref={ref}
        className={`${base} ${editable}`}
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        data-turn-id={turnId}
        // biome-ignore lint/a11y/useSemanticElements: contentEditable div is intentionally uncontrolled to preserve caret position; role="textbox" is correct ARIA for this pattern
        role="textbox"
        tabIndex={0}
        aria-label={ariaLabel}
        onFocus={() => {
          setIsFocused(true);
          onFocusChange?.(turnId, true);
        }}
        onBlur={(e) => {
          onCommit(turnId, e.currentTarget.textContent ?? "");
          setIsFocused(false);
          onFocusChange?.(turnId, false);
        }}
        onMouseUp={onSelect}
        onKeyUp={onSelect}
      >
        {text}
      </div>
    );
  },
  (a, b) =>
    a.text === b.text &&
    a.turnId === b.turnId &&
    a.ariaLabel === b.ariaLabel &&
    a.highlight === b.highlight,
);
