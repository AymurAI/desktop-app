import {
  type ReactNode,
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";

import { Checkbox as UiCheckbox } from "@aymurai/ui";

export interface Props {
  children?: ReactNode;
  disabled?: boolean;
  checked?: boolean;
  onChange?: (value: boolean) => void;
  name?: string;
}
export default forwardRef<{ value: boolean }, Props>(function Checkbox(
  { disabled = false, checked = false, name, onChange, children },
  ref,
) {
  const [isChecked, setIsChecked] = useState(checked);

  // Only exposes `value` object to the parent component
  useImperativeHandle(
    ref,
    () => {
      return {
        value: isChecked,
      };
    },
    [isChecked],
  );

  const handleToggle = (nextChecked: boolean) => {
    setIsChecked(nextChecked);
    onChange?.(nextChecked);
  };

  return (
    <UiCheckbox
      checked={isChecked}
      disabled={disabled}
      onChange={handleToggle}
      name={name}
    >
      {children}
    </UiCheckbox>
  );
});
