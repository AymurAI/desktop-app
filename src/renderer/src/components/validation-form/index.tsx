import { CheckCircle } from "phosphor-react";
import {
  Children,
  type FormEvent,
  type FormEventHandler,
  type ReactElement,
  type ReactNode,
  cloneElement,
  isValidElement,
  useEffect,
  useState,
} from "react";

import type { NativeComponent } from "@/types/component";
import { Button } from "@aymurai/ui";

import { css } from "@/styled/css";
import { styled } from "@/styled/jsx";

// `translate` (`"yes" | "no"`) and `color` (React's non-standard legacy DOM
// attribute, `string`) are both plain HTML attributes on every element, but
// Panda's styled `form` also defines `translate`/`color` as CSS shorthands
// (transform and the colour token union respectively) with incompatible
// types - omit them so spreading `...props` onto `styled.form` below
// typechecks, same pattern as uncontrolled-input/index.tsx's
// `NativeComponent<"input", ...>`.
interface Props extends NativeComponent<"form", "translate" | "color"> {
  children: ReactNode;
  title: string;
  onSubmit: FormEventHandler;
  onCheck: (checked: boolean) => void;
}
export default function ValidationForm({
  children,
  title,
  onSubmit,
  onCheck,
  ...props
}: Props) {
  const [checked, setChecked] = useState(false);

  const handleClick = () => setChecked(true);

  const onChange = () => {
    if (checked) setChecked(false);
  };

  // Add the onChange handler to every children
  const childrenWithHandler = Children.map(children, (child) => {
    if (isValidElement(child)) {
      return cloneElement(child as ReactElement<{ onChange: () => void }>, {
        onChange,
      });
    }
    return child;
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    onSubmit(e);
  };

  useEffect(() => {
    onCheck(checked);
  }, [checked, onCheck]);

  return (
    // Inlined from the deleted ValidationForm.styles.ts (`$l` -> spacing "6",
    // 24px) - its only consumer already imported Panda's `styled`, so a
    // separate file bought nothing.
    <styled.form
      display="flex"
      flexDirection="column"
      gap="6"
      {...props}
      onSubmit={handleSubmit}
    >
      <styled.h3 textStyle="subtitle.md.strong">{title}</styled.h3>
      {childrenWithHandler}
      <Button
        size="sm"
        className={css({ alignSelf: "flex-end" })}
        type="submit"
        onClick={handleClick}
        checked={checked}
      >
        Datos correctos
        {checked && <CheckCircle weight="fill" />}
      </Button>
    </styled.form>
  );
}
