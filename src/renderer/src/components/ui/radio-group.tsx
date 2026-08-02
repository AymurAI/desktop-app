import {
  Children,
  type ReactElement,
  type ReactNode,
  cloneElement,
  isValidElement,
} from "react";

import { css, cx } from "@/styled/css";
import { HStack } from "@/styled/jsx";

/**
 * RadioGroup — labelled wrapper around @aymurai/ui's `Radio`.
 *
 * @aymurai/ui exports `Radio` but no `RadioGroup`; the local
 * `components/radio/radio-group` is Stitches-based and must not be extended.
 */
const fieldset = css({
  border: "none",
  p: "0",
  m: "0",
  display: "flex",
  flexDirection: "column",
  gap: "2",
});

const legend = css({
  p: "0",
  mb: "1",
  textStyle: "label.md.default",
  color: "text.default",
});

export interface RadioGroupProps {
  label: string;
  name: string;
  children: ReactNode;
  className?: string;
}

export function RadioGroup({
  label,
  name,
  children,
  className,
}: RadioGroupProps) {
  const items = Children.map(children, (child) => {
    if (!isValidElement(child)) return child;

    return cloneElement(child as ReactElement<{ name?: string }>, { name });
  });

  return (
    <fieldset className={cx(fieldset, className)}>
      <legend className={legend}>{label}</legend>
      <HStack gap="4">{items}</HStack>
    </fieldset>
  );
}

export default RadioGroup;
