import { CaretDown, Check } from "phosphor-react";
import {
  type KeyboardEvent,
  type MouseEvent,
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import { sva } from "@/styled/css";
import { stack } from "@/styled/patterns";

// ─── Types (identical public API as legacy Select) ─────────────────────────
export type SelectOption = { id: string; text: string };
type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type Suggestion = Optional<SelectOption, "text">;

interface Props {
  options: SelectOption[];
  label?: string;
  helper?: string;
  selected?: SelectOption["id"];
  suggestion?: Suggestion;
  onChange?: (value: SelectOption | undefined) => void;
  priorityOrder?: SelectOption["id"][];
  placeholder?: string;
}

// ─── Styles (Panda CSS sva) ─────────────────────────────────────────────────
const select = sva({
  slots: [
    "container",
    "label",
    "trigger",
    "triggerText",
    "caret",
    "suggestion",
    "suggestionSep",
    "list",
    "item",
    "itemCheck",
    "helper",
    "liveRegion",
  ],
  base: {
    container: {
      ...stack.raw({ gap: "1" }),
      position: "relative",
      width: "full",
    },
    label: {
      textStyle: "label.sm.default",
      color: "text.lighter",
      display: "block",
    },
    trigger: {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      gap: "2",
      width: "full",

      px: "3",
      py: "3",

      bg: "white",
      border: "primary",
      rounded: "sm",

      cursor: "pointer",
      userSelect: "none",

      // Reset button styles
      textAlign: "left",
      appearance: "none",

      "&[data-open='true']": {
        boxShadow: "[0px 2px 2px rgba(0, 0, 0, 0.16)]",
        borderColor: "[#110041]",
      },

      "&:focus-visible": {
        outline: "2px solid token(colors.brand.primary)",
        outlineOffset: "2px",
      },
    },
    triggerText: {
      flex: "[1]",
      textStyle: "label.md.default",
      color: "text.default",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",

      "&[data-placeholder='true']": {
        color: "text.lighter",
      },
    },
    caret: {
      flexShrink: "0",
      color: "text.default",
      transition: "[transform 0.15s ease]",

      "&[data-open='true']": {
        transform: "[rotate(180deg)]",
      },
    },
    suggestion: {
      textStyle: "label.md.default",
      color: "brand.primary",
      cursor: "pointer",
      flexShrink: "0",
      // reset button
      appearance: "none",
      bg: "transparent",
      border: "none",
      p: "0",

      "&:focus-visible": {
        outline: "2px solid token(colors.brand.primary)",
        outlineOffset: "2px",
        rounded: "sm",
      },
    },
    suggestionSep: {
      color: "text.lighter",
      flexShrink: "0",
    },
    list: {
      position: "absolute",
      top: "[calc(100% + 4px)]",
      left: "0",
      right: "0",
      zIndex: "10",

      maxHeight: "[200px]",
      overflowY: "auto",

      bg: "white",
      rounded: "sm",
      boxShadow: "[0px 8px 16px rgba(0, 0, 0, 0.08)]",
      border: "secondary",

      display: "flex",
      flexDirection: "column",
    },
    item: {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      gap: "2",

      px: "3",
      py: "3",

      textStyle: "label.md.default",
      color: "text.default",
      cursor: "pointer",

      "&:hover": {
        bg: "bg.primary-alternative",
        outline: "none",
      },

      "&:focus-visible": {
        bg: "bg.primary-alternative",
        outline: "none",
      },

      // Highlighted via aria-activedescendant tracking
      "&[data-active='true']": {
        bg: "bg.primary-alternative",
        outline: "none",
      },

      "&[aria-selected='true']": {
        bg: "bg.primary-alternative",
      },
    },
    itemCheck: {
      flexShrink: "0",
      color: "brand.primary",
      visibility: "hidden",

      "&[data-checked='true']": {
        visibility: "visible",
      },
    },
    helper: {
      textStyle: "label.sm.default",
      color: "text.lighter",
    },
    // Visually hidden live region for screen readers
    liveRegion: {
      position: "absolute",
      width: "[1px]",
      height: "[1px]",
      overflow: "hidden",
      clip: "[rect(0,0,0,0)]",
      whiteSpace: "nowrap",
    },
  },
});

// ─── Helpers ────────────────────────────────────────────────────────────────
function findById(id: string | undefined, options: SelectOption[]) {
  return options.find((op) => op.id === id);
}

function orderByPriority(
  options: SelectOption[],
  priority: SelectOption["id"][] = [],
) {
  const filtered = options.filter(({ id }) => !priority.includes(id));
  const preferred = priority
    .map((p) => options.find(({ id }) => p === id))
    .filter((o): o is SelectOption => !!o);
  return [...preferred, ...filtered];
}

function secureSuggestion(
  suggestion: Suggestion | undefined,
  options: SelectOption[],
): SelectOption | undefined {
  if (!suggestion) return undefined;
  if (suggestion.text) return suggestion as SelectOption;
  return findById(suggestion.id, options);
}

// ─── Component ──────────────────────────────────────────────────────────────
export default forwardRef<{ value: SelectOption["id"] | undefined }, Props>(
  function Select(
    {
      label,
      helper,
      options,
      suggestion,
      selected,
      onChange,
      priorityOrder = [],
      placeholder = "",
    },
    ref,
  ) {
    const listId = useId();
    const triggerId = useId();
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const [selectedId, setSelectedId] = useState<string>(
      findById(selected, options)?.id ?? "",
    );
    const [isOpen, setIsOpen] = useState(false);
    // Tracks keyboard-active option index for aria-activedescendant
    const [activeIndex, setActiveIndex] = useState<number>(-1);

    useImperativeHandle(ref, () => ({ value: selectedId }), [selectedId]);

    const orderedOptions = orderByPriority(options, priorityOrder);
    const securedSuggestion = secureSuggestion(suggestion, options);
    const currentOption = findById(selectedId, options);
    const isValueEmpty = !selectedId;

    // ID helper for each option element — required by WAI-ARIA for aria-activedescendant
    const optionId = (id: string) => `${listId}-option-${id}`;

    // The id of the currently keyboard-active option (for aria-activedescendant)
    const activeOptionId =
      activeIndex >= 0 && activeIndex < orderedOptions.length
        ? optionId(orderedOptions[activeIndex].id)
        : undefined;

    // Close on outside click
    useEffect(() => {
      const handler = (e: globalThis.MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(e.target as Node)
        ) {
          setIsOpen(false);
          setActiveIndex(-1);
        }
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Scroll active option into view when navigating with keyboard
    useEffect(() => {
      if (activeIndex < 0 || !listRef.current) return;
      const activeEl = listRef.current.querySelector(
        `[data-active='true']`,
      ) as HTMLElement | null;
      activeEl?.scrollIntoView({ block: "nearest" });
    }, [activeIndex]);

    const updateValue = (newId: string) => {
      setSelectedId(newId);
      setIsOpen(false);
      setActiveIndex(-1);
      onChange?.(findById(newId, options));
    };

    // ── Trigger handlers ──
    const handleTriggerClick = () => {
      setIsOpen((prev) => {
        if (!prev) setActiveIndex(-1);
        return !prev;
      });
    };

    const handleTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
            setActiveIndex(0);
          } else {
            setActiveIndex((prev) =>
              prev < orderedOptions.length - 1 ? prev + 1 : prev,
            );
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          if (isOpen) {
            setActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
          }
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          if (isOpen && activeIndex >= 0) {
            updateValue(orderedOptions[activeIndex].id);
          } else {
            setIsOpen((prev) => !prev);
            setActiveIndex(0);
          }
          break;
        case "Escape":
          setIsOpen(false);
          setActiveIndex(-1);
          break;
        case "Tab":
          // Close on Tab so focus moves naturally
          setIsOpen(false);
          setActiveIndex(-1);
          break;
      }
    };

    // ── Item handlers ──
    const handleItemClick = (id: string) => (e: MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      updateValue(id);
    };

    const handleItemKeyDown =
      (id: string) => (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Escape") {
          setIsOpen(false);
          setActiveIndex(-1);
        } else if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          updateValue(id);
        }
      };

    // ── Suggestion handler ──
    const handleSuggestionClick =
      (id: string) => (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        updateValue(id);
      };

    const handleSuggestionKeyDown =
      (id: string) => (e: KeyboardEvent<HTMLButtonElement>) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          updateValue(id);
        }
      };

    const classes = select();

    return (
      <div ref={containerRef} className={classes.container}>
        {/* LABEL */}
        {label && (
          <label className={classes.label} htmlFor={triggerId}>
            {label}
          </label>
        )}

        {/* TRIGGER */}
        <button
          id={triggerId}
          type="button"
          // WAI-ARIA combobox pattern
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={listId}
          aria-autocomplete="list"
          // Points to the id of the currently keyboard-highlighted option
          aria-activedescendant={activeOptionId}
          data-open={isOpen}
          onClick={handleTriggerClick}
          onKeyDown={handleTriggerKeyDown}
          className={classes.trigger}
        >
          <span
            className={classes.triggerText}
            data-placeholder={!currentOption}
          >
            {currentOption?.text ?? placeholder}
          </span>

          {/* Suggestion chip (only when no value selected) */}
          {securedSuggestion && isValueEmpty && (
            <>
              <span className={classes.suggestionSep}>|</span>
              <button
                type="button"
                className={classes.suggestion}
                onClick={handleSuggestionClick(securedSuggestion.id)}
                onKeyDown={handleSuggestionKeyDown(securedSuggestion.id)}
              >
                {securedSuggestion.text}
              </button>
            </>
          )}

          <CaretDown
            size={16}
            className={classes.caret}
            data-open={isOpen}
            aria-hidden="true"
          />
        </button>

        {/* OPTION LIST */}
        {isOpen && orderedOptions.length > 0 && (
          // biome-ignore lint/a11y/useSemanticElements: custom listbox with checkmarks; native <select> cannot support this design
          <div
            ref={listRef}
            id={listId}
            role="listbox"
            tabIndex={-1}
            className={classes.list}
            aria-label={label}
          >
            {orderedOptions.map(({ id, text }, index) => {
              const isSelected = id === selectedId;
              const isActive = index === activeIndex;
              return (
                // biome-ignore lint/a11y/useSemanticElements: custom option with checkmark; native <option> cannot support this design
                <div
                  key={id}
                  id={optionId(id)}
                  role="option"
                  tabIndex={0}
                  // ✅ Only set aria-selected when true — omit for non-selected (per WAI-ARIA spec)
                  aria-selected={isSelected || undefined}
                  // Tracks keyboard focus for aria-activedescendant
                  data-active={isActive}
                  // aria-setsize / aria-posinset announce position to screen readers
                  aria-setsize={orderedOptions.length}
                  aria-posinset={index + 1}
                  className={classes.item}
                  onClick={handleItemClick(id)}
                  onKeyDown={handleItemKeyDown(id)}
                >
                  <span
                    className={classes.itemCheck}
                    data-checked={isSelected}
                    aria-hidden="true"
                  >
                    <Check size={14} weight="bold" />
                  </span>
                  {text}
                </div>
              );
            })}
          </div>
        )}

        {/* HELPER */}
        {helper && <p className={classes.helper}>{helper}</p>}

        {/*
         * Visually hidden live region — announces result count to screen readers
         * when the list opens (WCAG 4.1.3 / report requirement)
         */}
        <div
          className={classes.liveRegion}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {isOpen
            ? `${orderedOptions.length} ${orderedOptions.length === 1 ? "opción disponible" : "opciones disponibles"}`
            : ""}
        </div>
      </div>
    );
  },
);
