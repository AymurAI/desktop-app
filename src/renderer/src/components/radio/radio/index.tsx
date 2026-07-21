import {
  type ReactNode,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";

import { Radio as UiRadio } from "@aymurai/ui";

export interface Props {
  children?: ReactNode;
  name?: string;
  checked?: boolean;
  disabled?: boolean;
  onChange?: (value: boolean) => void;
}
export default forwardRef<{ value: boolean }, Props>(function Radio(
  { name, checked = false, disabled = false, onChange, children },
  ref,
) {
  const [isChecked, setIsChecked] = useState(checked);

  useEffect(() => {
    setIsChecked(checked);
  }, [checked]);

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

  const handleChange = (nextChecked: boolean) => {
    setIsChecked(nextChecked);
    onChange?.(nextChecked);
  };

  return (
    <UiRadio
      name={name}
      checked={isChecked}
      disabled={disabled}
      onChange={handleChange}
    >
      {children}
    </UiRadio>
  );
});
