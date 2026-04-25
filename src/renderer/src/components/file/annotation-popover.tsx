import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { css } from "@/styled/css";
import type {
  ComponentPropsWithoutRef,
  FocusEventHandler,
  ReactNode,
} from "react";
import { useRef, useState } from "react";

const triggerReset = css({
  appearance: "none",
  bg: "transparent",
  border: "[none]",
  padding: "0",
  cursor: "default",
  "&:focus-visible": {
    outline: "[2px solid token(colors.action.hover)]",
    outlineOffset: "[2px]",
    borderRadius: "sm",
  },
});

interface AnnotationPopoverProps {
  trigger: ReactNode;
  content: ReactNode;
  contentProps?: Omit<
    ComponentPropsWithoutRef<typeof PopoverContent>,
    "children"
  >;
}

export default function AnnotationPopover({
  trigger,
  content,
  contentProps,
}: AnnotationPopoverProps) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const isFocusInside = useRef(false);

  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => {
      if (!isFocusInside.current) setOpen(false);
    }, 100);
  };

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  const handleBlur: FocusEventHandler<HTMLDivElement> = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      isFocusInside.current = false;
      scheduleClose();
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={triggerReset}
        onMouseEnter={() => {
          cancelClose();
          setOpen(true);
        }}
        onMouseLeave={scheduleClose}
      >
        {trigger}
      </PopoverTrigger>
      <PopoverContent
        side="top"
        sideOffset={8}
        showArrow={false}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        onMouseEnter={cancelClose}
        onMouseLeave={scheduleClose}
        onFocus={() => {
          isFocusInside.current = true;
        }}
        onBlur={handleBlur}
        {...contentProps}
      >
        {content}
      </PopoverContent>
    </Popover>
  );
}
