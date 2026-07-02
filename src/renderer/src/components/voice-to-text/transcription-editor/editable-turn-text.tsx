import { memo, useRef } from "react";

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

interface EditableTurnTextProps {
  turnId: string;
  text: string;
  ariaLabel: string;
  onCommit: (turnId: string, value: string) => void;
  onSelect: () => void;
  onFocusChange?: (turnId: string, isFocused: boolean) => void;
}

export const EditableTurnText = memo(
  function EditableTurnText({
    turnId,
    text,
    ariaLabel,
    onCommit,
    onSelect,
    onFocusChange,
  }: EditableTurnTextProps) {
    const ref = useRef<HTMLDivElement>(null);
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
        onFocus={() => onFocusChange?.(turnId, true)}
        onBlur={(e) => {
          onCommit(turnId, e.currentTarget.textContent ?? "");
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
    a.text === b.text && a.turnId === b.turnId && a.ariaLabel === b.ariaLabel,
);
