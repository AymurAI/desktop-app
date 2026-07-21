import {
  Children,
  type ReactElement,
  type ReactNode,
  cloneElement,
  isValidElement,
  useState,
} from "react";

import { css } from "@/styled/css";
import type { Props as RadioProps } from "../radio";

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
  label?: string;
  name: string;
  direction?: "horizontal" | "vertical";
}
export default function RadioGroup({
  label,
  name,
  direction = "horizontal",
  children,
}: Props) {
  const childArray = Children.toArray(children);
  const initialSelected = childArray.findIndex(
    (child) =>
      isValidElement<RadioProps>(child) && child.props.checked === true,
  );
  const [selected, setSelected] = useState(initialSelected);

  // Inject the name to the children
  const radiosWithName = childArray.map((child, index) => {
    if (isValidElement<RadioProps>(child)) {
      return cloneElement(child as ReactElement<RadioProps>, {
        name,
        checked: selected === index,
        onChange: (nextChecked: boolean) => {
          if (nextChecked) setSelected(index);
          child.props.onChange?.(nextChecked);
        },
      });
    }
    return child;
  });

  return (
    <fieldset
      className={group}
      style={{ flexDirection: direction === "vertical" ? "column" : "row" }}
    >
      {label && <legend className={legend}>{label}</legend>}
      {radiosWithName}
    </fieldset>
  );
}
