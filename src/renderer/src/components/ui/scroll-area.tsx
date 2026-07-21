import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import type { ComponentPropsWithoutRef, Ref } from "react";

import { css, cx } from "@/styled/css";

const rootStyle = css({
  position: "relative",
  overflow: "hidden",
  width: "full",
  height: "full",
});

const viewportStyle = css({
  width: "full",
  height: "full",
});

const scrollbarStyle = css({
  display: "flex",
  userSelect: "none",
  touchAction: "none",
  p: "[2px]",

  '&[data-orientation="vertical"]': {
    width: "[10px]",
  },
  '&[data-orientation="horizontal"]': {
    flexDirection: "column",
    height: "[10px]",
  },
});

const thumbStyle = css({
  flex: "[1]",
  bg: "[#576171]",
  opacity: "[0.24]",
  rounded: "full",
  position: "relative",
});

type ScrollAreaProps = ComponentPropsWithoutRef<
  typeof ScrollAreaPrimitive.Viewport
> & {
  viewportRef?: Ref<HTMLDivElement>;
};

function ScrollArea({
  className,
  viewportRef,
  children,
  ...props
}: ScrollAreaProps) {
  return (
    <ScrollAreaPrimitive.Root className={cx(rootStyle, className)}>
      <ScrollAreaPrimitive.Viewport
        ref={viewportRef}
        className={viewportStyle}
        {...props}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollAreaPrimitive.Scrollbar
        orientation="vertical"
        className={scrollbarStyle}
      >
        <ScrollAreaPrimitive.Thumb className={thumbStyle} />
      </ScrollAreaPrimitive.Scrollbar>
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}

export default ScrollArea;
