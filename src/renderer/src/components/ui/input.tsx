import { cva, sva } from "@/styled/css";
import { hstack, stack } from "@/styled/patterns";
import { WarningCircle } from "phosphor-react";
import { forwardRef, useId } from "react";

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
        input: {
          // "&::placeholder": {
          //   color: "system.error-secondary",
          // },
        },
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
    // py: "3",
  },
  variants: {
    position: {
      prefix: { pl: "3", mr: "-3" },
      suffix: { pr: "3", ml: "-3" },
    },
  },
});

interface InputProps {
  // Rendering
  label?: string;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  helper?: string;
  // Control
  id?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  disabled?: boolean;
  error?: string | null;
  type?: "text" | "number";
  min?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      // Rendering
      label,
      placeholder,
      prefix,
      suffix,
      helper,
      // Control
      id,
      value,
      onChange,
      disabled = false,
      error,
      type = "text",
      min,
    },
    ref,
  ) => {
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

          <input
            ref={ref}
            id={inputId}
            onChange={onChange}
            value={value}
            disabled={disabled}
            placeholder={placeholder}
            className={classes.input}
            type={type}
            min={min}
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
  },
);

export default Input;
