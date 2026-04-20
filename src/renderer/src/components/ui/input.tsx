import { WarningCircle } from "phosphor-react";
import { useId } from "react";

import Suggestion from "@/components/ui/suggestion";
import { cva, sva } from "@/styled/css";
import { hstack, stack } from "@/styled/patterns";

const input = sva({
  slots: ["container", "inputBox", "input", "label", "errorMessage", "helper"],
  base: {
    container: stack.raw({ gap: "1", width: "full" }),
    inputBox: {
      ...hstack.raw({ alignItems: "center", gap: "1" }),

      rounded: "sm",
      border: "primary",

      "&:focus-within": {
        outline: "none",
        boxShadow: "[0px 2px 2px rgba(0, 0, 0, 0.16)]",
      },
    },
    input: {
      textStyle: "label.md.default",
      border: "none",
      outline: "none",
      flex: "[1]",

      p: "3",

      "&::placeholder": {
        color: "text.lighter",
      },
    },
    label: { textStyle: "label.sm.default" },
    errorMessage: {
      ...hstack.raw({ gap: "1" }),
      textStyle: "label.sm.default",
      color: "system.error",
    },
    helper: {
      textStyle: "label.sm.default",
      color: "text.lighter",
    },
  },
  variants: {
    disabled: {
      true: {
        inputBox: {
          bg: "bg.primary",
          border: "primary",
          color: "text.lighter",
          cursor: "not-allowed",
        },
        input: {
          cursor: "not-allowed",
        },
      },
      false: {
        inputBox: {
          bg: "white",
        },
      },
    },
    error: {
      true: {
        container: {
          color: "system.error",
        },
        inputBox: {
          border: "error",
        },
        input: {},
        label: { color: "system.error" },
      },
      false: {},
    },
  },
  defaultVariants: {
    error: false,
    disabled: false,
  },
});

const affix = cva({
  base: {
    ...hstack.raw({ alignItems: "center", gap: "1" }),
    userSelect: "none",
    textStyle: "label.md.default",
  },
  variants: {
    position: {
      prefix: { pl: "3", mr: "-3" },
      suffix: { pr: "3", ml: "-3" },
    },
  },
});

interface InputProps
  extends Omit<
      React.InputHTMLAttributes<HTMLInputElement>,
      "prefix" | "suffix"
    >,
    React.RefAttributes<HTMLInputElement> {
  // Rendering
  label?: string;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  suggestion?: string;
  helper?: string;
  // Control
  id?: string;
  value: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  disabled?: boolean;
  error?: string | null;
  type?: "text" | "number";
}
export default function Input({
  // Rendering
  label,
  placeholder,
  prefix,
  suffix,
  suggestion,
  helper,
  // Control
  id,
  ref,
  value,
  onChange,
  disabled = false,
  error,
  type,
  ...props
}: InputProps) {
  const randomId = useId();
  const inputId = id ?? randomId;
  const errorMessageId = `${inputId}-error`;

  const classes = input({ disabled, error: !!error });

  return (
    <div className={classes.container}>
      {label && (
        <label className={classes.label} htmlFor={inputId}>
          {label}
        </label>
      )}

      <div className={classes.inputBox}>
        {prefix && (
          <div className={affix({ position: "prefix" })}>
            <span>{prefix}</span>
            {/* In the designs this vertical bar is defined as a Text, but it's
            not. Use a Label instead */}
            <span>|</span>
          </div>
        )}

        {suggestion && <Suggestion clickable>{suggestion}</Suggestion>}

        <input
          {...props}
          ref={ref}
          id={inputId}
          onChange={onChange}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          className={classes.input}
          type="text"
          // Accessibility
          aria-describedby={errorMessageId}
          aria-invalid={!!error}
        />

        {suffix && (
          <div className={affix({ position: "suffix" })}>
            {/* In the designs this vertical bar is defined as a Text, but it's
            not. Use a Label instead */}
            <span>|</span>
            <span>{suffix}</span>
          </div>
        )}
      </div>

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
