import * as RadixSelect from "@radix-ui/react-select";
import { CaretDown, Check } from "phosphor-react";
import { useId } from "react";

import Suggestion from "@/components/ui/suggestion";
import { sva } from "@/styled/css";
import { styled } from "@/styled/jsx";
import { stack } from "@/styled/patterns";

const Affix = styled("span", {
  base: {
    textStyle: "label.md.default",
    color: "text.lighter",
    flexShrink: "0",
  },
});

export type SelectOption = { id: string; text: string };
export type SelectSuggestion = { text?: string; value: string };

interface SelectProps {
  options: SelectOption[];
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  prefix?: string;
  suffix?: string;
  suggestion?: SelectSuggestion;
  placeholder?: string;
  disabled?: boolean;
}

const select = sva({
  slots: [
    "container",
    "trigger",
    "value",
    "caret",
    "content",
    "item",
    "itemIndicator",
  ],
  base: {
    container: { ...stack.raw({ gap: "1" }), width: "full" },
    trigger: {
      display: "flex",
      alignItems: "center",
      gap: "2",
      width: "full",
      px: "3",
      py: "3",
      bg: "white",
      border: "primary",
      rounded: "sm",
      cursor: "pointer",
      textAlign: "left",
      appearance: "none",
      textStyle: "label.md.default",
      color: "text.default",

      "&[data-state='open']": {
        boxShadow: "[0px 2px 2px rgba(0, 0, 0, 0.16)]",
        borderColor: "[#110041]",
      },
      "&:focus-visible": {
        outlineColor: "brand.primary",
        outlineWidth: "0.5",
        outlineStyle: "solid",
        outlineOffset: "0.5",
      },
      "&[data-disabled]": {
        bg: "bg.primary",
        cursor: "not-allowed",
        color: "text.lighter",
      },
      "&[data-placeholder]": {
        color: "text.lighter",
      },
    },
    value: {
      flex: "[1]",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    caret: {
      flexShrink: "0",
      color: "text.default",
      transition: "[transform 0.15s ease]",

      "[data-state='open'] &": {
        transform: "[rotate(180deg)]",
      },
    },
    content: {
      bg: "white",
      rounded: "sm",
      boxShadow: "[0px 8px 16px rgba(0, 0, 0, 0.08)]",
      border: "secondary",
      overflow: "hidden",
      zIndex: "10",
      minWidth: "[var(--radix-select-trigger-width)]",
    },
    item: {
      display: "flex",
      alignItems: "center",
      gap: "2",
      px: "3",
      py: "3",
      textStyle: "label.md.default",
      color: "text.default",
      cursor: "pointer",
      outline: "none",
      userSelect: "none",

      "&[data-highlighted]": {
        bg: "bg.primary-alternative",
      },
      "&[data-state='checked']": {
        bg: "bg.primary-alternative",
      },
      "&[data-disabled]": {
        cursor: "not-allowed",
        color: "text.lighter",
      },
    },
    itemIndicator: {
      color: "brand.primary",
      display: "flex",
      alignItems: "center",
      flexShrink: "0",
    },
  },
});

export default function Select({
  options,
  label,
  value,
  onChange,
  prefix,
  suffix,
  suggestion,
  placeholder = "",
  disabled = false,
}: SelectProps) {
  const triggerId = useId();
  const classes = select();

  const handleSuggestionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(suggestion?.value ?? "");
  };

  const handleSuggestionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.stopPropagation();
      onChange?.(suggestion?.value ?? "");
    }
  };

  return (
    <div className={classes.container}>
      {label && (
        <styled.label
          textStyle="label.sm.default"
          color="text.lighter"
          htmlFor={triggerId}
        >
          {label}
        </styled.label>
      )}

      <RadixSelect.Root
        value={value}
        onValueChange={onChange}
        disabled={disabled}
      >
        <RadixSelect.Trigger id={triggerId} asChild>
          {/* biome-ignore lint/a11y/useSemanticElements lint/a11y/useAriaPropsForRole: Radix merges role, aria-expanded, aria-controls, and tabIndex onto this div at runtime via asChild */}
          <div className={classes.trigger} role="combobox" tabIndex={0}>
            {prefix && <Affix aria-hidden="true">{prefix} |</Affix>}

            <RadixSelect.Icon asChild>
              <CaretDown size={16} className={classes.caret} aria-hidden="true" />
            </RadixSelect.Icon>

            <span className={classes.value}>
              {!value && suggestion ? (
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onKeyDown={handleSuggestionKeyDown}
                  onClick={handleSuggestionClick}
                >
                  <Suggestion clickable>{suggestion.text ?? suggestion.value}</Suggestion>
                </button>
              ) : (
                <RadixSelect.Value placeholder={placeholder} />
              )}
            </span>

            {suffix && <Affix aria-hidden="true">| {suffix}</Affix>}
          </div>
        </RadixSelect.Trigger>

        <RadixSelect.Portal>
          <RadixSelect.Content
            className={classes.content}
            position="popper"
            sideOffset={4}
          >
            <RadixSelect.Viewport>
              {options.map(({ id, text }) => (
                <RadixSelect.Item key={id} value={id} className={classes.item}>
                  <RadixSelect.ItemIndicator className={classes.itemIndicator}>
                    <Check size={14} weight="bold" />
                  </RadixSelect.ItemIndicator>
                  <RadixSelect.ItemText>{text}</RadixSelect.ItemText>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
    </div>
  );
}
