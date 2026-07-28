import {
  type ChangeEventHandler,
  type KeyboardEventHandler,
  type MouseEventHandler,
  type ReactNode,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import type { NativeComponent } from "@/types/component";
import { TextField } from "@aymurai/ui";
import { forwardRef } from "react";

export type InputRefValue = { value: string };
interface Props
  extends NativeComponent<
    "input",
    "prefix" | "type" | "value" | "onChange" | "size"
  > {
  label?: string;
  suggestion?: string;
  helper?: string;
  sufix?: ReactNode;
  prefix?: ReactNode;
  defaultValue?: string;
  onChange?: (value: string) => void;
  type?: "text" | "number";
  specialCharacters?: string;
}
export default forwardRef<{ value: string }, Props>(function UncontrolledInput(
  {
    label,
    helper,
    suggestion,
    prefix,
    sufix,
    defaultValue,
    onChange,
    type = "text",
    specialCharacters = "",
    ...props
  },
  ref,
) {
  const [value, setValue] = useState<string>(defaultValue ?? "");
  const rootRef = useRef<HTMLDivElement>(null);

  // Only exposes `selected` object to the parent component
  useImperativeHandle(
    ref,
    () => {
      return {
        value,
      };
    },
    [value],
  );

  const updateValue = (newValue: string) => {
    if (type === "number") {
      const regex = new RegExp(`^[\\d${specialCharacters}.]+$`);
      if (regex.test(newValue) || !newValue) {
        setValue(newValue);
        onChange?.(newValue);
        return;
      }
      return;
    }

    setValue(newValue);

    onChange?.(newValue);
  };

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    updateValue(e.target.value);
  };

  const isSuggestionTarget = (target: EventTarget | null) =>
    target instanceof Element && target.closest("mark") !== null;

  const handleSuggestionClick: MouseEventHandler<HTMLDivElement> = (event) => {
    if (suggestion && !value && isSuggestionTarget(event.target)) {
      updateValue(suggestion);
    }
  };

  const handleSuggestionKeyDown: KeyboardEventHandler<HTMLDivElement> = (
    event,
  ) => {
    if (
      suggestion &&
      !value &&
      isSuggestionTarget(event.target) &&
      (event.key === "Enter" || event.key === " ")
    ) {
      event.preventDefault();
      updateValue(suggestion);
    }
  };

  useEffect(() => {
    const suggestionMark = rootRef.current?.querySelector("mark");
    if (suggestionMark && suggestion && !value) {
      suggestionMark.setAttribute("tabindex", "0");
      suggestionMark.setAttribute("role", "button");
    }
  }, [suggestion, value]);

  return (
    <div
      ref={rootRef}
      onClick={handleSuggestionClick}
      onKeyDown={handleSuggestionKeyDown}
    >
      <TextField
        value={value}
        type="text"
        label={label}
        helper={helper}
        suggestion={!value ? suggestion : undefined}
        prefix={prefix === undefined ? undefined : String(prefix)}
        suffix={sufix === undefined ? undefined : String(sufix)}
        onChange={handleChange}
        {...props}
      />
    </div>
  );
});
