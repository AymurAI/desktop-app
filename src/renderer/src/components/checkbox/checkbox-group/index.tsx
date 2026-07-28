import {
  Children,
  type ReactElement,
  type ReactNode,
  cloneElement,
  isValidElement,
} from "react";

import { css } from "@/styled/css";
import type { Props as CheckboxProps } from "../checkbox";

const group = css({
  display: "flex",
  gap: "4",
  flexWrap: "wrap",
  borderWidth: "0",
  p: "0",
});

const legend = css({
  textStyle: "subtitle.sm.default",
  color: "text.lighter",
  mb: "2",
});

interface Props {
  children: ReactNode;
  title?: string;
  name: string;
  direction?: "horizontal" | "vertical";
}
export default function CheckboxGroup({
  title,
  name,
  direction = "horizontal",
  children,
}: Props) {
  // Inject the name to the children
  const checkboxWithName = Children.map(children, (child) => {
    if (isValidElement(child)) {
      return cloneElement(child as ReactElement<CheckboxProps>, {
        name,
      });
    }
  });

  return (
    <fieldset
      className={group}
      style={{ flexDirection: direction === "vertical" ? "column" : "row" }}
    >
      {title && <legend className={legend}>{title}</legend>}
      {checkboxWithName}
    </fieldset>
  );
}
