import { CaretDown, User } from "phosphor-react";
import {
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import { useTranscriptionDispatch } from "@/hooks/useTranscriptions";
import { splitTurn } from "@/reducers/transcription/actions";
import { css } from "@/styled/css";
import type { Transcription } from "@/types/transcription";
import SpeakerPicker from "./speaker-picker";

// ---------------------------------------------------------------------------
// charOffset helper
// ---------------------------------------------------------------------------

/**
 * Returns the character offset of `node:offset` from the start of `container`
 * by measuring the range text length.
 */
export function charOffset(
  container: Node,
  node: Node,
  offset: number,
): number {
  const r = document.createRange();
  r.selectNodeContents(container);
  try {
    r.setEnd(node, offset);
  } catch {
    return 0;
  }
  return r.toString().length;
}

// ---------------------------------------------------------------------------
// Selection state shape
// ---------------------------------------------------------------------------

export interface SelectionState {
  turnId: string;
  start: number;
  end: number;
  /** Toolbar x position (px, relative to scroll container) */
  x: number;
  /** Toolbar y position (px, relative to scroll container) */
  y: number;
  /** When true, render the toolbar below the selection (near top of container) */
  below: boolean;
  /** Speaker id of the turn that owns the selection */
  speakerId: string;
}

// ---------------------------------------------------------------------------
// useSelectionAssign hook
// ---------------------------------------------------------------------------

export function useSelectionAssign(
  scrollRef: RefObject<HTMLElement | null>,
  transcription: Transcription,
) {
  const dispatch = useTranscriptionDispatch();
  const [sel, setSel] = useState<SelectionState | null>(null);

  const onSelect = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      setSel(null);
      return;
    }

    // Walk up to the [data-turn-id] container
    const ancestor = selection.getRangeAt(0).commonAncestorContainer;
    const el =
      ancestor.nodeType === Node.TEXT_NODE
        ? (ancestor.parentElement as HTMLElement | null)
        : (ancestor as HTMLElement);
    const turnEl = el?.closest<HTMLElement>("[data-turn-id]");
    if (!turnEl) {
      setSel(null);
      return;
    }

    const turnId = turnEl.dataset.turnId;
    if (!turnId) {
      setSel(null);
      return;
    }

    const { anchorNode, anchorOffset, focusNode, focusOffset } = selection;
    if (!anchorNode || !focusNode) {
      setSel(null);
      return;
    }

    const a = charOffset(turnEl, anchorNode, anchorOffset);
    const b = charOffset(turnEl, focusNode, focusOffset);
    const start = Math.min(a, b);
    const end = Math.max(a, b);

    if (end - start < 1) {
      setSel(null);
      return;
    }

    // Compute toolbar position relative to the scroll container
    const range = selection.getRangeAt(0);
    const rangeRect = range.getBoundingClientRect();
    const container = scrollRef.current;
    if (!container) {
      setSel(null);
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const scrollTop = container.scrollTop;
    const scrollLeft = container.scrollLeft;

    // Centre of the selection range, relative to container viewport offset + scroll
    const x =
      rangeRect.left - containerRect.left + scrollLeft + rangeRect.width / 2;

    // Position above: y is top of range minus container top + scrollTop
    const yAbove = rangeRect.top - containerRect.top + scrollTop - 8; // 8px gap

    // If selection is near the top of the container (toolbar would render off-screen),
    // render below instead
    const TOOLBAR_HEIGHT = 48;
    const below = rangeRect.top - containerRect.top < TOOLBAR_HEIGHT + 16;
    const y = below
      ? rangeRect.bottom - containerRect.top + scrollTop + 8
      : yAbove;

    const turn = transcription.turns.find((t) => t.id === turnId);
    const speakerId = turn?.speakerId ?? "";

    setSel({ turnId, start, end, x, y, below, speakerId });
  }, [scrollRef, transcription.turns]);

  const clear = useCallback(() => {
    setSel(null);
    window.getSelection()?.removeAllRanges();
  }, []);

  const assign = useCallback(
    (speakerId: string) => {
      if (!sel) return;
      dispatch(
        splitTurn(transcription.id, sel.turnId, sel.start, sel.end, speakerId),
      );
      clear();
    },
    [sel, dispatch, transcription.id, clear],
  );

  return { sel, onSelect, clear, assign };
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const toolbar = css({
  position: "absolute",
  display: "flex",
  alignItems: "center",
  gap: "2",
  bg: "bg.overlay-dark",
  borderRadius: "md",
  boxShadow: "menu",
  px: "3",
  py: "2",
  zIndex: "100",
  pointerEvents: "auto",
  // Centre horizontally via transform; shift up by full height when above
  transform: "translateX(-50%) translateY(-100%)",
  // Override transform when below
  "&[data-below=true]": {
    transform: "translateX(-50%)",
  },
});

const assignBtn = css({
  display: "flex",
  alignItems: "center",
  gap: "[6px]",
  bg: "transparent",
  border: "[none]",
  color: "text.on-overlay-dark",
  fontSize: "[14px]",
  fontWeight: "[600]",
  cursor: "pointer",
  padding: "[4px 8px]",
  borderRadius: "sm",
  whiteSpace: "nowrap",
  "&:hover": {
    // NOTE: bracketed — un token de hover sobre superficie oscura para un solo
    // componente sería sobre-ingeniería.
    bg: "[rgba(255,255,255,0.12)]",
  },
});

// ---------------------------------------------------------------------------
// SelectionToolbar component
// ---------------------------------------------------------------------------

export interface SelectionToolbarProps {
  sel: SelectionState | null;
  transcription: Transcription;
  onAssign: (speakerId: string) => void;
  onClose: () => void;
}

export function SelectionToolbar({
  sel,
  transcription,
  onAssign,
  onClose,
}: SelectionToolbarProps) {
  const { t } = useTranslation("voice-to-text");
  const [pickerOpen, setPickerOpen] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Reset picker state when selection changes or clears
  // biome-ignore lint/correctness/useExhaustiveDependencies: sel is useState — intentional dep to reset on each new selection
  useEffect(() => {
    setPickerOpen(false);
  }, [sel]);

  // Close toolbar on outside pointerdown
  useEffect(() => {
    if (!sel) return;
    const handler = (e: PointerEvent) => {
      if (
        toolbarRef.current &&
        !toolbarRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("pointerdown", handler, true);
    return () => document.removeEventListener("pointerdown", handler, true);
  }, [sel, onClose]);

  if (!sel) return null;

  return (
    <div
      ref={toolbarRef}
      className={toolbar}
      data-below={sel.below ? "true" : "false"}
      style={{
        left: sel.x,
        top: sel.y,
      }}
      // Prevent selection from being cleared when clicking the toolbar
      onPointerDown={(e) => e.preventDefault()}
    >
      <button
        type="button"
        className={assignBtn}
        onClick={() => setPickerOpen((v) => !v)}
      >
        <User size={16} weight="bold" />
        {t("selectionToolbar.assignTo")}
        <CaretDown size={12} weight="bold" />
      </button>

      {pickerOpen && (
        <SpeakerPicker
          transcription={transcription}
          currentSpeakerId={sel.speakerId}
          onPick={(speakerId) => {
            setPickerOpen(false);
            onAssign(speakerId);
          }}
          onClose={() => setPickerOpen(false)}
          style={{
            top: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            marginTop: "6px",
          }}
        />
      )}
    </div>
  );
}
