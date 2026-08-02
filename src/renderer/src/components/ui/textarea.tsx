// TODO: upstream a `multiline` variant to @aymurai/ui TextField and delete this file.

import { Suggestion } from "@aymurai/ui";
import { WarningCircle } from "phosphor-react";
import { type TextareaHTMLAttributes, useId } from "react";

import { sva } from "@/styled/css";
import { stack } from "@/styled/patterns";

/**
 * Textarea — multiline form input mirroring @aymurai/ui's TextField visuals
 * (floating label, container/input recipe, disabled/error/typed/suggestion
 * states) since TextField's `type` prop has no multiline variant and
 * RichTextEditor (tiptap) is too heavy for a 1-2 line summary field.
 *
 * Unlike TextField, the suggestion mark is rendered BELOW the control
 * (an inline mark does not fit a multiline field).
 */
const textarea = sva({
  slots: [
    "container",
    "textareaBox",
    "textarea",
    "label",
    "errorMessage",
    "helper",
    "suggestionRow",
  ],
  base: {
    container: stack.raw({ gap: "1", width: "full" }),
    textareaBox: {
      p: "3",
      rounded: "sm",
      border: "primary",
      bg: "bg.secondary",

      "&:focus-within": {
        outline: "none",
        border: "primary-alt",
        boxShadow: "input-focus",
      },
    },
    textarea: {
      textStyle: "label.md.default",
      borderWidth: "0",
      outline: "none",
      width: "full",
      display: "block",
      resize: "vertical",
      bg: "[transparent]",
      color: "text.default",
      fontFamily: "[inherit]",

      "&::placeholder": {
        color: "text.lighter",
      },
    },
    label: { textStyle: "label.sm.default", color: "text.lighter" },
    errorMessage: {
      margin: "0",
      display: "flex",
      alignItems: "center",
      gap: "1",
      textStyle: "label.sm.default",
      color: "system.error",
    },
    helper: {
      margin: "0",
      textStyle: "label.sm.default",
      color: "text.lighter",
    },
    suggestionRow: {
      display: "flex",
    },
  },
  variants: {
    disabled: {
      true: {
        textareaBox: {
          bg: "bg.primary",
          border: "primary",
          cursor: "not-allowed",
        },
        textarea: {
          cursor: "not-allowed",
          color: "text.lighter",
        },
      },
      false: {},
    },
    error: {
      true: {
        textareaBox: { border: "error" },
        textarea: { color: "system.error" },
        label: { color: "system.error" },
      },
      false: {},
    },
    typed: {
      true: {
        textareaBox: { border: "secondary" },
        label: { color: "text.default" },
      },
      false: {},
    },
    suggestion: {
      true: {
        textareaBox: {
          border: "secondary",
          boxShadow: "input-focus",
        },
      },
      false: {},
    },
  },
  defaultVariants: {
    error: false,
    disabled: false,
    typed: false,
    suggestion: false,
  },
});

export interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> {
  /** Floating label above the textarea */
  label?: string;
  id?: string;
  value: string | undefined;
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
  /** Suggestion mark shown BELOW the textarea (an inline mark does not fit multiline) */
  suggestion?: string;
  /** Helper text shown below the control when there is no error */
  helper?: string;
  disabled?: boolean;
  /** Error string — shown below the control with an icon; also sets aria-invalid */
  error?: string | null;
  rows?: number;
}

export function Textarea({
  label,
  id,
  value,
  onChange,
  suggestion,
  helper,
  disabled = false,
  error,
  rows = 4,
  ...props
}: TextareaProps) {
  const randomId = useId();
  const textareaId = id ?? randomId;
  const errorMessageId = `${textareaId}-error`;

  const isTyped = !!value && !disabled && !error;
  const hasSuggestion = !!suggestion;

  const classes = textarea({
    disabled,
    error: !!error,
    typed: isTyped,
    suggestion: hasSuggestion,
  });

  return (
    <div className={classes.container}>
      {label && (
        <label className={classes.label} htmlFor={textareaId}>
          {label}
        </label>
      )}

      <div className={classes.textareaBox}>
        <textarea
          {...props}
          id={textareaId}
          rows={rows}
          onChange={onChange}
          value={value ?? ""}
          disabled={disabled}
          className={classes.textarea}
          aria-describedby={errorMessageId}
          aria-invalid={!!error}
        />
      </div>

      {suggestion && (
        <div className={classes.suggestionRow}>
          <Suggestion clickable>{suggestion}</Suggestion>
        </div>
      )}

      {helper && !error && <p className={classes.helper}>{helper}</p>}
      {error && (
        <p id={errorMessageId} role="alert" className={classes.errorMessage}>
          <WarningCircle size={12} />
          {error}
        </p>
      )}
    </div>
  );
}

export default Textarea;
